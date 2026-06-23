<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\User;
use App\Models\Fanpage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FacebookAuthController extends Controller
{
    public function callback(Request $request)
    {
        $request->validate([
            'access_token' => 'required|string',
        ]);

        $shortLivedToken = $request->input('access_token');

        $appId = config('services.facebook.client_id');
        $appSecret = config('services.facebook.client_secret');

        if (empty($appId) || empty($appSecret)) {
            return response()->json(['error' => 'Facebook credentials not configured on server'], 500);
        }

        // 1. Exchange short-lived token for long-lived user access token
        $tokenResponse = Http::get("https://graph.facebook.com/v20.0/oauth/access_token", [
            'grant_type' => 'fb_exchange_token',
            'client_id' => $appId,
            'client_secret' => $appSecret,
            'fb_exchange_token' => $shortLivedToken,
        ]);

        if ($tokenResponse->failed()) {
            Log::error('Facebook Token Exchange Failed', ['response' => $tokenResponse->json()]);
            return response()->json(['error' => 'Failed to exchange Facebook token'], 400);
        }

        $longLivedUserToken = $tokenResponse->json()['access_token'];

        // 2. Fetch user profile from Facebook
        $userResponse = Http::get("https://graph.facebook.com/v20.0/me", [
            'fields' => 'id,name,email,picture.type(large)',
            'access_token' => $longLivedUserToken,
        ]);

        if ($userResponse->failed()) {
            Log::error('Facebook User Profile Fetch Failed', ['response' => $userResponse->json()]);
            return response()->json(['error' => 'Failed to fetch user profile'], 400);
        }

        $fbUser = $userResponse->json();
        $email = $fbUser['email'] ?? ($fbUser['id'] . '@facebook.com');
        $avatar = $fbUser['picture']['data']['url'] ?? null;

        // Create or update user in database
        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $fbUser['name'],
                'avatar' => $avatar,
            ]
        );

        // 3. Fetch user's Facebook Pages
        $pagesResponse = Http::get("https://graph.facebook.com/v20.0/me/accounts", [
            'fields' => 'id,name,access_token,picture.type(large)',
            'access_token' => $longLivedUserToken,
        ]);

        if ($pagesResponse->failed()) {
            Log::error('Facebook User Pages Fetch Failed', ['response' => $pagesResponse->json()]);
        } else {
            $pagesData = $pagesResponse->json()['data'] ?? [];

            foreach ($pagesData as $page) {
                // Save or update Fanpage
                Fanpage::updateOrCreate(
                    [
                        'fb_page_id' => $page['id']
                    ],
                    [
                        'user_id' => $user->id,
                        'name' => $page['name'],
                        'access_token' => $page['access_token'], // will be auto-encrypted via Eloquent cast
                        'avatar_url' => $page['picture']['data']['url'] ?? null,
                    ]
                );
            }
        }

        // Generate Sanctum token for frontend
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Login successful',
        ]);
    }

    public function demoLogin(Request $request)
    {
        $user = User::firstOrCreate(
            ['email' => 'demo@zeflyo.io'],
            [
                'name' => 'Demo User',
                'avatar' => null,
            ]
        );

        // Ensure the demo Fanpage exists in database and belongs to the logged-in demo user
        Fanpage::updateOrCreate(
            ['fb_page_id' => '1028776643660761'],
            [
                'user_id' => $user->id,
                'name' => 'Zeflyo Shop',
                'access_token' => 'mock_page_token_123',
                'avatar_url' => 'https://scontent.fsgn5-12.fna.fbcdn.net/v/t39.30808-1/721191302_122104337678601169_7824205172456629659_n.jpg?stp=c0.12.924.923a_dst-jpg_s200x200_tt6&_nc_cat=103&ccb=1-7&_nc_sid=f907e8&_nc_ohc=18ez1ZOY5wMQ7kNvwFEfm4p&_nc_oc=Adqfa0kmQjtMKfqosX7_emW1NL93VjtytU_-czxgq6j9aPKXwNmX4ONqWrt9A_KwuCE&_nc_zt=24&_nc_ht=scontent.fsgn5-12.fna&edm=AGaHXAAEAAAA&_nc_gid=z7iPdlZ1k9Z_YS3Z3SW09w&_nc_tpa=Q5bMBQHoRMAne_dTpJDSP2icnyjbq1XIodzQekRObKSF6i7mbGAe3R93tc5bPtmbObWLtmEDtI6DKVASMQ&oh=00_Af8AYhMIqIpfpQj3A9rf31dd9MI17oeV_EWMsMIvuw59mg&oe=6A404194',
                'is_active' => true,
            ]
        );

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Demo Login successful',
        ]);
    }
}
