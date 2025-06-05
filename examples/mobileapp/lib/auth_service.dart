import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:http/http.dart' as http;

class AuthService {
  static const String _baseUrl = 'http://localhost:5173';
  static const String _appId = '3a47f051-9004-4722-8c36-c07cbd7c757f'; // Replace with your actual app ID
  static const String _callbackUrl = 'com.novalogin.mobileapp://auth';

  /// Generate a cryptographically secure random string
  static String _generateRandomString(int length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    final random = Random.secure();
    return List.generate(length, (index) => chars[random.nextInt(chars.length)]).join();
  }

  /// Generate PKCE code verifier and challenge
  static Map<String, String> _generatePKCE() {
    final codeVerifier = _generateRandomString(128);
    final bytes = utf8.encode(codeVerifier);
    final digest = sha256.convert(bytes);
    final codeChallenge = base64Url.encode(digest.bytes).replaceAll('=', '');
    
    return {
      'codeVerifier': codeVerifier,
      'codeChallenge': codeChallenge,
    };
  }

  /// Start the authentication flow
  static Future<AuthResult> authenticate() async {
    try {
      final pkce = _generatePKCE();
      final state = _generateRandomString(32);
      
      // Build the authorization URL matching the backend's expected format
      final authUrl = Uri.parse('$_baseUrl/login').replace(queryParameters: {
        'id': _appId,
        'cb': _callbackUrl,
        'challenge': pkce['codeChallenge']!,
        'state': state,
      });

      // Launch the web auth flow
      final result = await FlutterWebAuth2.authenticate(
        url: authUrl.toString(),
        callbackUrlScheme: 'com.novalogin.mobileapp',
      );

      // Parse the callback URL
      final callbackUri = Uri.parse(result);
      final code = callbackUri.queryParameters['code'];
      final returnedState = callbackUri.queryParameters['state'];
      final error = callbackUri.queryParameters['error'];

      if (error != null) {
        return AuthResult.error('Authentication failed: $error');
      }

      if (code == null) {
        return AuthResult.error('No authorization code received');
      }

      if (returnedState != state) {
        return AuthResult.error('State mismatch - possible CSRF attack');
      }

      // Exchange the code for tokens
      final tokenResult = await _exchangeCodeForToken(code, pkce['codeVerifier']!);
      return tokenResult;

    } catch (e) {
      return AuthResult.error('Authentication failed: $e');
    }
  }

  /// Exchange authorization code for access token
  static Future<AuthResult> _exchangeCodeForToken(String code, String codeVerifier) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/login/token').replace(queryParameters: {
          'code': code,
          'verifier': codeVerifier,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return AuthResult.success(
          accessToken: data['access_token'],
          logoutToken: data['logout_token'],
          userId: data['user_id']?.toString(),
        );
      } else {
        final errorData = json.decode(response.body);
        return AuthResult.error('Token exchange failed: ${errorData['error'] ?? response.statusCode}');
      }
    } catch (e) {
      return AuthResult.error('Token exchange failed: $e');
    }
  }

  /// Verify if a token is still valid
  static Future<bool> verifyToken(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/login/verify-token').replace(queryParameters: {
          'token': token,
          'secret': 'your-app-secret', // Replace with your actual app secret
        }),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['status'] == 'Success';
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /// Get user information from token
  static Future<User?> getUserInfo(String token) async {
    try {
      return User(userId: 'example_user_id'); // Replace with actual user fetching logic
    } catch (e) {
      return null;
    }
  }

  /// Logout by invalidating the token
  static Future<void> logout(String? logoutToken) async {
    if (logoutToken == null) return;
    
    try {
      await http.get(
        Uri.parse('$_baseUrl/api/login/logout').replace(queryParameters: {
          'logout_token': logoutToken,
        }),
      );
    } catch (e) {
      // Ignore logout errors - we'll clear local state anyway
    }
  }
}

class AuthResult {
  final bool success;
  final String? accessToken;
  final String? logoutToken;
  final String? userId;
  final String? error;

  AuthResult._({
    required this.success,
    this.accessToken,
    this.logoutToken,
    this.userId,
    this.error,
  });

  factory AuthResult.success({
    required String accessToken,
    String? logoutToken,
    String? userId,
  }) {
    return AuthResult._(
      success: true,
      accessToken: accessToken,
      logoutToken: logoutToken,
      userId: userId,
    );
  }

  factory AuthResult.error(String error) {
    return AuthResult._(
      success: false,
      error: error,
    );
  }
}

class User {
  final String userId;
  
  User({required this.userId});
}
