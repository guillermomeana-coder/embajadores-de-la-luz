'use client';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at 50% 30%, #0d2016 0%, #060e09 60%, #030a05 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-serif, serif)',
    }}>
      {/* Flower of Life */}
      <svg viewBox="-65 -65 130 130" width="100" height="100" fill="none"
        style={{ marginBottom: 32, filter: 'drop-shadow(0 0 20px rgba(232,201,109,0.8))' }}>
        <defs><clipPath id="fol-login"><circle cx="0" cy="0" r="62"/></clipPath></defs>
        <g clipPath="url(#fol-login)" stroke="#e8c96d" strokeWidth="0.9">
          <circle cx="0" cy="0" r="30" opacity="0.95"/>
          <circle cx="30" cy="0" r="30" opacity="0.95"/>
          <circle cx="15" cy="25.98" r="30" opacity="0.95"/>
          <circle cx="-15" cy="25.98" r="30" opacity="0.95"/>
          <circle cx="-30" cy="0" r="30" opacity="0.95"/>
          <circle cx="-15" cy="-25.98" r="30" opacity="0.95"/>
          <circle cx="15" cy="-25.98" r="30" opacity="0.95"/>
        </g>
        <circle cx="0" cy="0" r="62" stroke="#e8c96d" strokeWidth="1" opacity="0.7"/>
      </svg>

      <h1 style={{
        fontFamily: 'var(--font-display, serif)', fontSize: 28, letterSpacing: '0.2em',
        textTransform: 'uppercase', color: '#f5ead6', marginBottom: 8, textAlign: 'center',
      }}>
        Embajadores
      </h1>
      <p style={{ fontFamily: 'var(--font-script, cursive)', fontSize: 20, color: '#e8c96d', marginBottom: 48 }}>
        de la Luz
      </p>
      <p style={{ color: 'rgba(245,234,214,0.6)', fontSize: 14, marginBottom: 32, textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
        Ingresa con tu cuenta de Google para continuar tu misión.
      </p>

      <button
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(232,201,109,0.08)', border: '1px solid rgba(232,201,109,0.4)',
          borderRadius: 999, padding: '12px 28px', cursor: 'pointer',
          color: '#f5ead6', fontSize: 15, letterSpacing: '0.1em',
          fontFamily: 'var(--font-display, serif)',
          transition: 'all 0.3s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,201,109,0.15)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(232,201,109,0.08)')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuar con Google
      </button>

      <a href="/" style={{ marginTop: 32, color: 'rgba(245,234,214,0.4)', fontSize: 13, textDecoration: 'none' }}>
        ← Volver al mapa
      </a>
    </div>
  );
}
