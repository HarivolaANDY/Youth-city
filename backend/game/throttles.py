from rest_framework.throttling import AnonRateThrottle

class LoginRateThrottle(AnonRateThrottle):
    """Limits login attempts per IP to prevent brute-force credential stuffing."""
    scope = 'auth_login'

class RegisterRateThrottle(AnonRateThrottle):
    """Limits new account registrations per IP to mitigate spam and automated bots."""
    scope = 'auth_register'
