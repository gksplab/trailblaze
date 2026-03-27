import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Flame, User, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFirestoreError = (err: any, operation: OperationType, path: string) => {
    const errInfo = {
      error: err.message || String(err),
      code: err.code,
      operationType: operation,
      path,
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
      }
    };
    console.error('Firestore Error:', JSON.stringify(errInfo, null, 2));
    throw err;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        try {
          // Create profile
          await setDoc(doc(db, 'users', user.uid), {
            name,
            email,
            avatarColor: Math.random() > 0.5 ? '#4ade80' : '#f97316',
            units: 'km'
          });
        } catch (fsErr: any) {
          handleFirestoreError(fsErr, OperationType.WRITE, `users/${user.uid}`);
          
          try {
            await deleteUser(user);
          } catch (delErr) {
            console.error('Failed to delete auth user:', delErr);
          }
          throw fsErr;
        }
      }
    } catch (err: any) {
      console.error('Full Auth Error Object:', err);
      let message = 'An unexpected error occurred. Please try again.';
      
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please login instead.';
      } else if (err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password. Please check your credentials.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (err.code === 'permission-denied') {
        message = 'Account created but profile setup failed. Please contact support.';
      } else if (err.message) {
        message = err.message;
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary/30 antialiased overflow-hidden relative">
      {/* Topographic Background Layer */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-surface/20 via-surface/60 to-surface z-10"></div>
        <img 
          className="w-full h-full object-cover opacity-40 scale-110" 
          alt="dramatic silhouette of misty mountain peaks at dawn" 
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1920"
          referrerPolicy="no-referrer"
        />
        <div className="grainy-overlay absolute inset-0 z-20"></div>
      </div>

      <main className="relative z-30 min-h-screen flex flex-col items-center justify-center px-6 pt-12 pb-24 overflow-y-auto">
        {/* Brand Anchor */}
        <div className="flex flex-col items-center mb-12">
          <div className="bg-primary-container/30 p-4 rounded-xl backdrop-blur-md mb-4 shadow-[0_0_30px_rgba(45,90,39,0.2)]">
            <Flame className="text-primary w-12 h-12" />
          </div>
          <h1 className="font-headline font-black text-4xl tracking-tighter text-on-surface uppercase leading-none">TRAILBLAZE</h1>
          <p className="font-label text-tertiary text-xs tracking-[0.2em] mt-2 opacity-80 uppercase">The Tactile Explorer</p>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-sm space-y-8">
          {/* Auth Toggle */}
          <div className="bg-surface-container-low p-1 rounded-xl flex items-center justify-between shadow-inner">
            <button 
              onClick={() => setIsLogin(true)}
              className={cn(
                "flex-1 py-3 px-6 text-sm font-label font-bold tracking-widest rounded-lg transition-all duration-300",
                isLogin ? "bg-primary-container text-on-primary-container shadow-lg" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              LOGIN
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={cn(
                "flex-1 py-3 px-6 text-sm font-label font-bold tracking-widest rounded-lg transition-all duration-300",
                !isLogin ? "bg-primary-container text-on-primary-container shadow-lg" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              SIGN UP
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="group"
                  >
                    <label className="block font-label text-[10px] font-bold tracking-widest text-tertiary mb-2 uppercase ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                      <input 
                        className="w-full bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-on-surface placeholder:text-outline/40 pl-12 pr-4 py-4 rounded-t-lg transition-all duration-300" 
                        placeholder="Alex Honnold" 
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field */}
              <div className="group">
                <label className="block font-label text-[10px] font-bold tracking-widest text-tertiary mb-2 uppercase ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                  <input 
                    className="w-full bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-on-surface placeholder:text-outline/40 pl-12 pr-4 py-4 rounded-t-lg transition-all duration-300" 
                    placeholder="hiker@trail.com" 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="font-label text-[10px] font-bold tracking-widest text-tertiary uppercase">Password</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                  <input 
                    className="w-full bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-on-surface placeholder:text-outline/40 pl-12 pr-4 py-4 rounded-t-lg transition-all duration-300" 
                    placeholder="••••••••" 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-error-container/20 border border-error-container/50 rounded-xl"
              >
                <p className="text-error text-xs font-medium text-center">{error}</p>
              </motion.div>
            )}

            <div className="flex justify-end">
              <a className="text-xs font-label text-on-surface-variant hover:text-primary transition-colors tracking-wide" href="#">Forgot Password?</a>
            </div>

            {/* CTA */}
            <button 
              disabled={loading}
              className="w-full py-5 bg-gradient-to-br from-primary to-primary-container rounded-lg font-headline font-bold text-on-primary text-lg shadow-[0_10px_30px_rgba(45,90,39,0.4)] active:scale-95 transition-all duration-200 flex items-center justify-center gap-3" 
              type="submit"
            >
              {loading ? 'Processing...' : isLogin ? 'Begin Your Adventure' : 'Create Account'}
              <ArrowRight className="w-6 h-6" />
            </button>
          </form>
        </div>
      </main>

      {/* Top Overlay Shadow */}
      <div className="fixed top-0 left-0 w-full h-32 bg-gradient-to-b from-background to-transparent pointer-events-none z-40"></div>
    </div>
  );
}
