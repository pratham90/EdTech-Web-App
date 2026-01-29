import React, { useState } from 'react';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../shared/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '../../../shared/components/ui/radio-group';
import { useAuth } from '../../../contexts/AuthContext';
import { GraduationCap, Users, Brain } from 'lucide-react';
import { toast } from 'sonner';

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const { login, signup, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(email, password, role);
        toast.success('Login successful!');
      } else {
        await signup(email, password, name, role);
        toast.success('Account created successfully!');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error(error.message || 'Authentication failed. Please try again.');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setRole('student');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 bg-background">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.05)_0%,transparent_50%),radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.05)_0%,transparent_50%)]"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-20 h-20 bg-primary/10 rounded-full animate-float"></div>
      <div
        className="absolute bottom-20 right-20 w-16 h-16 bg-primary/10 rounded-full animate-float"
        style={{ animationDelay: '2s' }}
      ></div>
      <div
        className="absolute top-1/2 left-10 w-12 h-12 bg-primary/10 rounded-full animate-float"
        style={{ animationDelay: '4s' }}
      ></div>

      <Card className="w-full max-w-md bg-card shadow-soft-lg border relative z-10">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary rounded-full animate-glow opacity-50"></div>
              <div className="relative p-4 bg-primary rounded-full">
                <Brain className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
          <CardTitle className="text-3xl text-foreground">EduTech Platform</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            AI-powered learning platform for teachers and students
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={isLogin ? 'login' : 'signup'} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="login"
                onClick={() => {
                  setIsLogin(true);
                  resetForm();
                }}
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                onClick={() => {
                  setIsLogin(false);
                  resetForm();
                }}
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* LOGIN FORM */}
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label>I am a</Label>
                  <RadioGroup value={role} onValueChange={(value) => setRole(value)}>
                    <div className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-accent hover:border-primary/20 transition-all duration-200 cursor-pointer group">
                      <RadioGroupItem value="student" id="student" />
                      <div className="p-2 bg-info rounded-lg group-hover:scale-110 transition-transform duration-200">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="student" className="cursor-pointer font-medium">
                          Student
                        </Label>
                        <p className="text-xs text-muted-foreground">Learn and practice with AI</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-accent hover:border-primary/20 transition-all duration-200 cursor-pointer group">
                      <RadioGroupItem value="teacher" id="teacher" />
                      <div className="p-2 bg-primary rounded-lg group-hover:scale-110 transition-transform duration-200">
                        <GraduationCap className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="teacher" className="cursor-pointer font-medium">
                          Teacher
                        </Label>
                        <p className="text-xs text-muted-foreground">Create and manage content</p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <Button
                  type="submit"
                  className="w-full shadow-soft transition-all duration-200 hover:shadow-soft-lg"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            {/* SIGNUP FORM */}
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label>I am a</Label>
                  <RadioGroup value={role} onValueChange={(value) => setRole(value)}>
                    <div className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-accent hover:border-primary/20 transition-all duration-200 cursor-pointer group">
                      <RadioGroupItem value="student" id="signup-student" />
                      <div className="p-2 bg-info rounded-lg group-hover:scale-110 transition-transform duration-200">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="signup-student" className="cursor-pointer font-medium">
                          Student
                        </Label>
                        <p className="text-xs text-muted-foreground">Learn and practice with AI</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-accent hover:border-primary/20 transition-all duration-200 cursor-pointer group">
                      <RadioGroupItem value="teacher" id="signup-teacher" />
                      <div className="p-2 bg-primary rounded-lg group-hover:scale-110 transition-transform duration-200">
                        <GraduationCap className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="signup-teacher" className="cursor-pointer font-medium">
                          Teacher
                        </Label>
                        <p className="text-xs text-muted-foreground">Create and manage content</p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <Button
                  type="submit"
                  className="w-full shadow-soft transition-all duration-200 hover:shadow-soft-lg"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

