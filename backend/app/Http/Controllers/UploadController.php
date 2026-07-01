<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    /**
     * Handle file upload.
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'nullable|file|image|max:5120',
            'image' => 'nullable|file|image|max:5120',
        ]);

        $file = $request->file('file') ?? $request->file('image');

        if ($file && $file->isValid()) {
            // Store the file in public disk, under 'uploads' directory
            $path = $file->store('uploads', 'public');
            
            // Get public URL
            $url = asset('storage/' . $path);

            return response()->json([
                'url' => $url,
                'message' => 'Upload successful'
            ]);
        }

        return response()->json([
            'error' => 'No file uploaded or file is invalid'
        ], 400);
    }
}
