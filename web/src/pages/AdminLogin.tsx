import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

export default function AdminLogin() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { data } = await api.post('/admin/login', { username, password });
            localStorage.setItem('adminToken', data.token);
            navigate('/admin');
        } catch (error) {
            const err = error as { response?: { data?: { error?: string } } };
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <Link to="/events" className="absolute top-6 left-6 md:left-16 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to site
            </Link>

            <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Admin Portal</h1>
                    <p className="text-sm text-muted-foreground mt-2">Sign in to manage events.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="bg-transparent"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-transparent"
                        />
                    </div>

                    <Button type="submit" className="w-full h-11" disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
