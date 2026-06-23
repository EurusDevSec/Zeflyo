<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;

class ProductController extends Controller
{
    /**
     * List all products for the authenticated user.
     */
    public function index(Request $request)
    {
        $query = $request->user()->products();

        if ($request->has('search') && $request->input('search')) {
            $query->where('name', 'ilike', '%' . $request->input('search') . '%');
        }

        if ($request->has('enabled')) {
            $query->where('auto_post_enabled', $request->boolean('enabled'));
        }

        $products = $query->orderBy('sort_order')->orderBy('created_at', 'desc')->get();

        return response()->json(['products' => $products]);
    }

    /**
     * Create a new product.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'image_urls' => 'nullable|array',
            'image_urls.*' => 'string|url',
            'comment' => 'nullable|string|max:2000',
            'auto_post_enabled' => 'nullable|boolean',
        ]);

        $maxOrder = $request->user()->products()->max('sort_order') ?? 0;

        $product = Product::create([
            'user_id' => $request->user()->id,
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'image_urls' => $request->input('image_urls', []),
            'comment' => $request->input('comment'),
            'auto_post_enabled' => $request->boolean('auto_post_enabled', true),
            'sort_order' => $maxOrder + 1,
        ]);

        return response()->json([
            'message' => 'Product created successfully.',
            'product' => $product,
        ], 201);
    }

    /**
     * Update a product.
     */
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        if ($product->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:5000',
            'image_urls' => 'nullable|array',
            'image_urls.*' => 'string|url',
            'comment' => 'nullable|string|max:2000',
            'auto_post_enabled' => 'nullable|boolean',
        ]);

        $product->update($request->only([
            'name', 'description', 'image_urls', 'comment', 'auto_post_enabled',
        ]));

        return response()->json([
            'message' => 'Product updated successfully.',
            'product' => $product->fresh(),
        ]);
    }

    /**
     * Delete a product.
     */
    public function destroy(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        if ($product->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted successfully.']);
    }

    /**
     * Reorder products.
     */
    public function reorder(Request $request)
    {
        $request->validate([
            'order' => 'required|array',
            'order.*.id' => 'required|integer|exists:products,id',
            'order.*.sort_order' => 'required|integer|min:0',
        ]);

        $userId = $request->user()->id;

        foreach ($request->input('order') as $item) {
            Product::where('id', $item['id'])
                ->where('user_id', $userId)
                ->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['message' => 'Products reordered successfully.']);
    }
}
