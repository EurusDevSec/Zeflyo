<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>New Zeflyo Feedback</title>
</head>
<body style="font-family: Arial, sans-serif; color: #1f2937;">
    <div style="max-width: 680px; margin: 0 auto; padding: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px;">
        <h1 style="font-size: 24px; margin-bottom: 16px; color: #111827;">New Feedback Received</h1>
        <p style="margin-bottom: 24px; color: #475569;">A new feedback submission has arrived from the Zeflyo Settings module.</p>

        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 12px; font-weight: 700; color: #0f172a; width: 170px;">Type</td>
                <td style="padding: 12px; color: #334155;">{{ ucfirst($feedback->type) }}</td>
            </tr>
            <tr style="background: #f1f5f9;">
                <td style="padding: 12px; font-weight: 700; color: #0f172a;">Title</td>
                <td style="padding: 12px; color: #334155;">{{ $feedback->title }}</td>
            </tr>
            <tr>
                <td style="padding: 12px; font-weight: 700; color: #0f172a; vertical-align: top;">Content</td>
                <td style="padding: 12px; color: #334155; white-space: pre-wrap;">{{ $feedback->content }}</td>
            </tr>
            <tr style="background: #f1f5f9;">
                <td style="padding: 12px; font-weight: 700; color: #0f172a;">Contact Email</td>
                <td style="padding: 12px; color: #334155;">{{ $feedback->contact_email ?? 'None' }}</td>
            </tr>
            <tr>
                <td style="padding: 12px; font-weight: 700; color: #0f172a;">User ID</td>
                <td style="padding: 12px; color: #334155;">{{ $feedback->user_id }}</td>
            </tr>
            @if ($feedback->image_urls)
                <tr style="background: #f1f5f9;">
                    <td style="padding: 12px; font-weight: 700; color: #0f172a; vertical-align: top;">Images</td>
                    <td style="padding: 12px; color: #334155;">
                        <ul style="padding-left: 18px; margin: 0;">
                            @foreach ($feedback->image_urls as $url)
                                <li><a href="{{ $url }}" target="_blank" rel="noreferrer noopener">{{ $url }}</a></li>
                            @endforeach
                        </ul>
                    </td>
                </tr>
            @endif
        </table>
    </div>
</body>
</html>
