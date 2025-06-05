import 'package:flutter/material.dart';
import 'dart:async';
import 'auth_service.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Nova Auth Demo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

enum AppState { loading, error, loggedIn, loggingOut, notLoggedIn }

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with TickerProviderStateMixin {
  AppState _state = AppState.loading;
  User? _user;
  String? _accessToken;
  String? _logoutToken;
  String? _error;
  int _countdown = 3;
  Timer? _countdownTimer;
  late AnimationController _loadingController;
  late AnimationController _progressController;

  @override
  void initState() {
    super.initState();
    _loadingController = AnimationController(
      duration: const Duration(seconds: 1),
      vsync: this,
    )..repeat();
    
    _progressController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    );
    
    _fetchUser();
  }

  @override
  void dispose() {
    _loadingController.dispose();
    _progressController.dispose();
    _countdownTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchUser() async {
    setState(() {
      _state = AppState.loading;
      _error = null;
    });

    try {
      // Check if we have a stored access token (in a real app, you'd use secure storage)
      if (_accessToken != null) {
        final isValid = await AuthService.verifyToken(_accessToken!);
        if (isValid) {
            setState(() {
              _state = AppState.loggedIn;
            });
            return;
        }
        // Token is invalid, clear it
        _accessToken = null;
        _logoutToken = null;
      }

      // No valid token, show login screen
      setState(() {
        _user = null;
        _state = AppState.notLoggedIn;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load user information: $e';
        _state = AppState.error;
      });
    }
  }

  Future<void> _refreshProfile() async {
    await _fetchUser();
  }

  Future<void> _logout() async {
    setState(() {
      _state = AppState.loggingOut;
      _countdown = 3;
    });

    _progressController.forward();

    // Perform logout in background
    if (_logoutToken != null) {
      AuthService.logout(_logoutToken);
    }

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _countdown--;
      });

      if (_countdown <= 0) {
        timer.cancel();
        _redirectToLogin();
      }
    });
  }

  void _redirectToLogin() {
    // Clear all auth state and show login screen
    setState(() {
      _state = AppState.notLoggedIn;
      _countdown = 3;
      _user = null;
      _accessToken = null;
      _logoutToken = null;
    });
    _progressController.reset();
  }

  Future<void> _signIn() async {
    setState(() {
      _state = AppState.loading;
    });

    try {
      final result = await AuthService.authenticate();
      
      if (result.success) {
        setState(() {
          _accessToken = result.accessToken;
          _logoutToken = result.logoutToken;
          _user = User(userId: result.userId ?? 'Unknown User');
          _state = AppState.loggedIn;
        });
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Successfully signed in!')),
          );
        }
      } else {
        setState(() {
          _error = result.error ?? 'Authentication failed';
          _state = AppState.error;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Authentication failed: $e';
        _state = AppState.error;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFF0F9FF), // blue-50
              Color(0xFFE0E7FF), // indigo-100
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 400),
                child: Card(
                  elevation: 8,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: _buildContent(),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    switch (_state) {
      case AppState.loading:
        return _buildLoadingState();
      case AppState.loggingOut:
        return _buildLoggingOutState();
      case AppState.error:
        return _buildErrorState();
      case AppState.loggedIn:
        return _buildUserProfile();
      case AppState.notLoggedIn:
        return _buildLoginScreen();
    }
  }

  Widget _buildLoadingState() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        RotationTransition(
          turns: _loadingController,
          child: Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              border: Border.all(
                color: Colors.indigo.shade600,
                width: 3,
              ),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Container(
              margin: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: Colors.indigo.shade600,
                    width: 3,
                  ),
                ),
                borderRadius: BorderRadius.circular(21),
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Loading your profile...',
          style: TextStyle(
            color: Colors.grey.shade600,
            fontSize: 16,
          ),
        ),
      ],
    );
  }

  Widget _buildLoggingOutState() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF4ADE80), Color(0xFF3B82F6)], // green-400 to blue-500
            ),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.check,
            color: Colors.white,
            size: 40,
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          "You've been signed out",
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937), // gray-800
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Redirecting to login in $_countdown second${_countdown != 1 ? 's' : ''}...',
          style: TextStyle(
            color: Colors.grey.shade600,
            fontSize: 16,
          ),
        ),
        const SizedBox(height: 16),
        Container(
          width: double.infinity,
          height: 8,
          decoration: BoxDecoration(
            color: Colors.grey.shade200,
            borderRadius: BorderRadius.circular(4),
          ),
          child: AnimatedBuilder(
            animation: _progressController,
            builder: (context, child) {
              return FractionallySizedBox(
                alignment: Alignment.centerLeft,
                widthFactor: _progressController.value,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.indigo.shade600,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildErrorState() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          Icons.error_outline,
          color: Colors.red.shade500,
          size: 64,
        ),
        const SizedBox(height: 16),
        Text(
          _error ?? 'An error occurred',
          style: TextStyle(
            color: Colors.red.shade600,
            fontSize: 16,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: _fetchUser,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.indigo.shade600,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: const Text('Try Again'),
        ),
      ],
    );
  }

  Widget _buildLoginScreen() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // App icon/logo
        Container(
          width: 80,
          height: 80,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF818CF8), Color(0xFFA855F7)], // indigo-400 to purple-500
            ),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.security,
            color: Colors.white,
            size: 40,
          ),
        ),
        const SizedBox(height: 24),

        // Welcome message
        const Text(
          'Welcome to Nova Auth',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937), // gray-800
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 12),

        // Description
        Text(
          'Secure authentication for your mobile applications',
          style: TextStyle(
            color: Colors.grey.shade600,
            fontSize: 16,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),

        // Sign in button
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _signIn,
            icon: const Icon(Icons.login),
            label: const Text('Sign In'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.indigo.shade600,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Additional info
        Text(
          'Tap "Sign In" to start the secure authentication flow',
          style: TextStyle(
            color: Colors.grey.shade500,
            fontSize: 14,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildUserProfile() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Avatar
        Container(
          width: 80,
          height: 80,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF818CF8), Color(0xFFA855F7)], // indigo-400 to purple-500
            ),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.person,
            color: Colors.white,
            size: 40,
          ),
        ),
        const SizedBox(height: 24),

        // Welcome message
        const Text(
          'Welcome back!',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937), // gray-800
          ),
        ),
        const SizedBox(height: 12),

        // User info
        if (_user?.userId != null) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.account_circle,
                color: Colors.indigo.shade500,
                size: 20,
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  _user!.userId,
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 16,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
        ],

        // Action buttons
        Column(
          children: [
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _refreshProfile,
                icon: const Icon(Icons.refresh),
                label: const Text('Refresh Profile'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.indigo.shade600,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _logout,
                icon: const Icon(Icons.logout),
                label: const Text('Sign Out'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.grey.shade700,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  side: BorderSide(color: Colors.grey.shade300),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
