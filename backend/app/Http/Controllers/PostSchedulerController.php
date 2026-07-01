<?php

namespace App\Http\Controllers;

use App\Models\ScheduledPost;
use App\Services\GeminiService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PostSchedulerController extends Controller
{
    /**
     * Display a listing of scheduled posts for the authenticated user.
     */
    public function index(Request $request)
    {
        $posts = $request->user()->scheduledPosts()
            ->orderBy('scheduled_at', 'desc')
            ->get();

        return response()->json([
            'posts' => $posts,
        ]);
    }

    /**
     * Store a new scheduled post.
     */
    public function store(Request $request)
    {
        $request->validate([
            'fanpage_ids' => 'required|array|min:1',
            'fanpage_ids.*' => 'integer|exists:fanpages,id',
            'content' => 'required|string',
            'image_url' => 'nullable|url',
            'scheduled_at' => 'required|date',
            'status' => 'nullable|string|in:draft,pending,published,failed',
        ]);

        // Ensure user owns all target fanpages
        $userFanpageIds = $request->user()->fanpages()->pluck('id')->toArray();
        foreach ($request->input('fanpage_ids') as $id) {
            if (! in_array($id, $userFanpageIds)) {
                return response()->json([
                    'error' => "Unauthorized to schedule posts for fanpage ID {$id}",
                ], 403);
            }
        }

        // Validate scheduled_at is in the future, if status is pending
        $scheduledAt = Carbon::parse($request->input('scheduled_at'));
        $status = $request->input('status', 'pending');

        if ($status === 'pending' && $scheduledAt->isPast()) {
            return response()->json([
                'error' => 'Scheduled time must be in the future.',
            ], 422);
        }

        $post = ScheduledPost::create([
            'user_id' => $request->user()->id,
            'fanpage_ids' => $request->input('fanpage_ids'),
            'content' => $request->input('content'),
            'image_url' => $request->input('image_url'),
            'scheduled_at' => $scheduledAt,
            'status' => $status,
        ]);

        return response()->json([
            'message' => 'Post scheduled successfully',
            'post' => $post,
        ], 201);
    }

    /**
     * Cancel/Delete a scheduled post.
     */
    public function destroy(Request $request, $id)
    {
        $post = ScheduledPost::findOrFail($id);

        if ($post->user_id !== $request->user()->id) {
            return response()->json([
                'error' => 'Unauthorized',
            ], 403);
        }

        $post->delete();

        return response()->json([
            'message' => 'Scheduled post deleted successfully',
        ]);
    }

    /**
     * Generate post content using Gemini AI.
     */
    public function generateAi(Request $request)
    {
        $request->validate([
            'topic' => 'required|string',
            'tone' => 'nullable|string',
        ]);

        $topic = $request->input('topic');
        $tone = $request->input('tone', 'Thân thiện');

        $systemPrompt = "Bạn là một chuyên gia marketing / viết bài quảng cáo thương mại điện tử chuyên nghiệp trên Facebook.\n"
            ."Nhiệm vụ của bạn là viết một bài đăng Facebook hấp dẫn dựa trên chủ đề người dùng cung cấp.\n"
            ."Hãy tuân thủ các yêu cầu sau:\n"
            ."1. Bố cục bài đăng phải rõ ràng, phân chia đoạn mạch lạc.\n"
            ."2. Sử dụng các emoji sinh động, phù hợp để bài viết trực quan và thu hút hơn.\n"
            ."3. Kết thúc bài viết bằng một lời kêu gọi hành động (CTA) thân thiện và danh sách các hashtag phổ biến liên quan.\n"
            ."4. Giọng điệu của bài viết phải là: {$tone}.\n"
            .'Hãy chỉ trả về nội dung của bài viết đăng Facebook đó, không thêm bất kỳ văn bản chào hỏi hay giải thích nào khác.';

        $service = app(GeminiService::class);
        $content = $service->generateReply($topic, $systemPrompt);

        if ($content === null) {
            return response()->json([
                'error' => 'Không thể sinh nội dung bằng AI tại thời điểm này. Vui lòng kiểm tra API Key hoặc thử lại sau.',
            ], 500);
        }

        return response()->json([
            'content' => $content,
        ]);
    }

    /**
     * Generate AI post content using SSE streaming.
     */
    public function generateAiStream(Request $request)
    {
        $request->validate([
            'topic' => 'required|string|max:1000',
            'goal' => 'required|string|max:1000',
            'framework' => 'required|string|in:aida,pas,bab',
            'tone' => 'nullable|string|max:100',
            'post_length' => 'nullable|string|in:short,medium,long',
        ]);

        $geminiService = app(GeminiService::class);

        return response()->stream(function () use ($request, $geminiService) {
            set_time_limit(0);

            // Clear output buffers to ensure instant flush to client
            if (! app()->environment('testing')) {
                while (ob_get_level() > 0) {
                    ob_end_clean();
                }
            }

            $messages = $this->buildPrompts($request->all());

            $geminiService->generateReplyStream($messages, function ($chunk) {
                echo 'data: '.json_encode(['chunk' => $chunk])."\n\n";
                if (ob_get_level() > 0) {
                    ob_flush();
                }
                flush();

                if (connection_aborted()) {
                    Log::info('Client disconnected. Aborting Gemini streaming.');
                    exit;
                }
            });

            echo "event: end\n";
            echo 'data: '.json_encode(['status' => 'completed'])."\n\n";
            if (ob_get_level() > 0) {
                ob_flush();
            }
            flush();
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    /**
     * Build system prompts with structured framework instructions (Value-First).
     */
    private function buildPrompts(array $data): array
    {
        $topic = $data['topic'];
        $goal = $data['goal'];
        $framework = strtolower($data['framework']);
        $tone = $data['tone'] ?? 'Thân thiện';

        $lengthMap = [
            'short' => 'ngắn gọn, xúc tích (dưới 100 từ)',
            'medium' => 'độ dài trung bình (150-250 từ)',
            'long' => 'chi tiết, đầy đủ thông tin (trên 300 từ)',
        ];
        $length = $lengthMap[$data['post_length'] ?? 'medium'] ?? $lengthMap['medium'];

        $frameworkInstruction = '';
        if ($framework === 'aida') {
            $frameworkInstruction = "Áp dụng công thức AIDA theo nguyên lý Value-First (Trao giá trị trước):\n"
                ."1. Attention (Thu hút sự chú ý): Mở đầu bằng một câu hỏi gợi mở, một thống kê giật mình hoặc một khẳng định mạnh mẽ để người đọc dừng chân.\n"
                ."2. Interest (Kích thích sự tò mò): Cung cấp thông tin bổ ích giải thích khía cạnh cốt lõi của vấn đề, chứng minh vì sao họ cần quan tâm.\n"
                ."3. Desire (Tạo dựng mong muốn): Nêu bật lợi ích thực tế của sản phẩm/dịch vụ giúp giải quyết vấn đề đó. ĐẶC BIỆT: Tích hợp ưu đãi hấp dẫn như tặng quà/voucher trị giá đến 70% giá trị để nâng cao khao khát sở hữu.\n"
                .'4. Action (Lời kêu gọi hành động): Kêu gọi hành động rõ ràng (CTA) chiếm khoảng 30% nội dung để thúc giục đăng ký/mua hàng.';
        } elseif ($framework === 'pas') {
            $frameworkInstruction = "Áp dụng công thức PAS theo nguyên lý Value-First (Trao giá trị trước):\n"
                ."1. Problem (Xác định vấn đề): Gọi tên chính xác khó khăn, trở ngại hoặc nỗi đau mà khách hàng mục tiêu đang gặp phải một cách khách quan.\n"
                ."2. Agitate (Xoáy sâu nỗi đau): Chỉ ra những hậu quả tiêu cực, sự bất tiện hoặc tổn thất nếu vấn đề không được giải quyết kịp thời, tạo sự đồng cảm sâu sắc.\n"
                .'3. Solve (Giải pháp sản phẩm): Giới thiệu sản phẩm/dịch vụ như giải pháp cứu cánh tối ưu, giải quyết triệt để vấn đề đã nêu.';
        } elseif ($framework === 'bab') {
            $frameworkInstruction = "Áp dụng công thức BAB theo nguyên lý Value-First (Trao giá trị trước):\n"
                ."1. Before (Trước đây - Thực trạng): Vẽ ra bức tranh khó khăn, bất tiện hoặc trạng thái chưa được tối ưu ban đầu của khách hàng.\n"
                ."2. After (Sau này - Tương lai): Mô tả viễn cảnh tươi sáng, sự thành công hoặc cảm giác hài lòng khi vấn đề được giải quyết trọn vẹn.\n"
                .'3. Bridge (Cầu nối giải pháp): Đóng vai trò là cầu nối, giới thiệu sản phẩm/dịch vụ chính là yếu tố quyết định chuyển đổi từ thực trạng (Before) sang viễn cảnh tươi sáng (After).';
        }

        $systemPrompt = "Bạn là chuyên gia viết bài quảng cáo và marketing Facebook (Copywriter) có kỹ năng cao.\n"
            ."Nhiệm vụ: Hãy viết một bài đăng Facebook chất lượng cao, thuyết phục dựa trên các yêu cầu sau:\n\n"
            ."1. Chủ đề bài viết: {$topic}\n"
            ."2. Mục tiêu mong muốn đạt được: {$goal}\n"
            ."3. Giọng điệu (Tone): {$tone}\n"
            ."4. Độ dài bài viết: {$length}\n\n"
            ."YÊU CẦU CẤU TRÚC VÀ ĐỊNH DẠNG:\n"
            ."{$frameworkInstruction}\n\n"
            ."CÁC QUY TẮC PHỤ:\n"
            ."- Sử dụng emoji sinh động một cách tinh tế để cấu trúc bài viết.\n"
            ."- Chia nhỏ đoạn văn để người đọc dễ theo dõi trên thiết bị di động.\n"
            ."- Thêm các hashtag liên quan ở cuối bài viết.\n"
            .'- Hãy CHỈ trả về nội dung bài viết đăng Facebook, tuyệt đối không thêm bất kỳ văn bản giải thích, phân tích cấu trúc hay lời chào mừng nào khác.';

        return [
            [
                'role' => 'user',
                'parts' => [
                    ['text' => $systemPrompt],
                ],
            ],
        ];
    }
}
