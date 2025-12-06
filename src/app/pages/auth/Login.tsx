import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Logo } from '@/app/components/shared/Logo';
import { GradientText } from '@/app/components/shared/GradientText';
import { SEO } from '@/app/components/shared/SEO';
import { animations, colors } from '@/lib/designSystem';
import { handleApiError, handleSuccess } from '@/lib/errorHandling';

/**
 * Login Page Component
 * 
 * Features:
 * - Responsive design (mobile, tablet, desktop)
 * - Password visibility toggle
 * - Smooth animations
 * - Ready for API integration
 * - Beautiful gradient illustration on desktop
 */
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Integrate with backend API
    try {
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password }),
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Login failed');
      // }
      // 
      // const data = await response.json();
      // handleSuccess('Login successful!');
      // Redirect to /app/todo
      
      // Temporary: Show not implemented error
      setError('Login functionality not yet implemented');
    } catch (error) {
      handleApiError(error, { title: 'Login Failed' });
      setError('Login failed. Please try again.');
    } finally {
      setTimeout(() => setIsLoading(false), 1000); // Simulated delay
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <SEO
        title="Login"
        description="Sign in to Displini to access your personalized health and productivity dashboard."
        url="https://displini.com/login"
      />
      {/* Left Panel - Gradient Illustration (Hidden on mobile) */}
      <motion.div
        {...animations.fadeIn}
        className="hidden md:flex md:w-1/2 lg:w-2/5 relative overflow-hidden"
        style={{ background: colors.gradients.primary }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <Sparkles className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">
              Welcome Back!
            </h1>
            <p className="text-lg text-white/90 max-w-md">
              Sign in to access your personal dashboard and continue your journey with Displini.
            </p>
          </motion.div>

          {/* Decorative Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-16 grid grid-cols-3 gap-8 text-center"
          >
            <div>
              <div className="text-3xl font-bold mb-1">10K+</div>
              <div className="text-sm text-white/80">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">50K+</div>
              <div className="text-sm text-white/80">Tasks Completed</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">98%</div>
              <div className="text-sm text-white/80">Satisfaction</div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Panel - Login Form */}
      <motion.div
        {...animations.fadeIn}
        className="flex-1 flex items-center justify-center p-6 md:p-12"
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 text-center"
          >
            <Logo variant="black" size="lg" className="mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900">
              Sign in to <GradientText>Displini</GradientText>
            </h2>
            <p className="mt-2 text-gray-600">
              Enter your credentials to access your account
            </p>
          </motion.div>

          {/* Login Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleLogin}
            className="space-y-6"
          >
            {/* Email Input */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label 
                  htmlFor="remember-me" 
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              <a 
                href="#" 
                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium text-base transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-50 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>

              <button
                type="button"
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                </svg>
                Apple
              </button>
            </div>
          </motion.form>

          {/* Sign Up Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center text-sm text-gray-600"
          >
            Don't have an account?{' '}
            <a 
              href="#" 
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Sign up
            </a>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}

