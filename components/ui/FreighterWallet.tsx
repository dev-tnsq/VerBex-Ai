import React, { useState, useEffect } from 'react';
import { useFreighter } from '../../hooks/useFreighter';
import { Button } from './button';
import { Input } from './input';

interface FreighterWalletProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export default function FreighterWallet({ onConnect, onDisconnect }: FreighterWalletProps) {
  const {
    connected,
    publicKey,
    error,
    loading,
    connect,
    disconnect,
    signXDR,
  } = useFreighter();

  const [xdr, setXdr] = useState('');
  const [signedXdr, setSignedXdr] = useState('');
  const [signing, setSigning] = useState(false);
  const [wasConnected, setWasConnected] = useState(false);

  useEffect(() => {
    if (connected && !wasConnected) {
      setWasConnected(true);
      onConnect && onConnect();
    }
    if (!connected && wasConnected) {
      setWasConnected(false);
      onDisconnect && onDisconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  const handleSign = async () => {
    setSigning(true);
    setSignedXdr('');
    const result = await signXDR(xdr);
    // Handle both string and object result
    if (typeof result === 'string') {
      setSignedXdr(result);
    } else if (result && typeof result === 'object' && 'signedTxXdr' in result) {
      setSignedXdr(result.signedTxXdr);
    } else {
      setSignedXdr('');
    }
    setSigning(false);
  };

  return (
    <div className="modal-retro max-w-md mx-auto p-4 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 pixel-border bg-retro flex items-center justify-center">
          {/* Pixel/neon wallet icon */}
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <rect x="2" y="4" width="20" height="16" stroke="#7CFFB2" strokeWidth="2" fill="#000" />
            <rect x="5" y="9" width="14" height="6" stroke="#7CFFB2" strokeWidth="1.5" fill="#000" />
            <circle cx="18" cy="12" r="1.5" fill="#7CFFB2" />
          </svg>
        </div>
        <div>
          <div className="text-base font-semibold neon" style={{ fontFamily: 'Press Start 2P, monospace' }}>Stellar Wallet</div>
          <div className="text-xs neon" style={{ opacity: 0.8, fontFamily: 'Press Start 2P, monospace' }}>Universal Wallet Connect</div>
        </div>
      </div>
      <div className="mb-2">
        {connected ? (
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-2 h-2 bg-[#7CFFB2]" style={{ borderRadius: 0 }} />
            <span className="text-xs neon font-medium">Connected</span>
            <span className="font-mono text-xs neon select-all ml-2">
              {publicKey?.slice(0, 6)}...{publicKey?.slice(-4)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-2 h-2 bg-red-500" style={{ borderRadius: 0 }} />
            <span className="text-xs" style={{ color: '#ff4d4f', fontFamily: 'Press Start 2P, monospace' }}>Not Connected</span>
          </div>
        )}
      </div>
      {!connected && (
        <Button onClick={connect} disabled={loading} className="mb-2 w-full button-retro">
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      )}
      {connected && (
        <div className="mb-2 space-y-2">
          <Button onClick={disconnect} className="w-full button-retro">Disconnect</Button>
        </div>
      )}
      {connected && (
        <div className="mb-2">
          <label className="block text-sm neon mb-1" style={{ fontFamily: 'Press Start 2P, monospace' }}>Sign Transaction XDR</label>
          <Input
            type="text"
            value={xdr}
            onChange={e => setXdr(e.target.value)}
            placeholder="Enter XDR to sign"
            className="mb-2 input-retro"
          />
          <Button onClick={handleSign} disabled={signing || !xdr} className="w-full button-retro">
            {signing ? 'Signing...' : 'Sign XDR'}
          </Button>
          {signedXdr && (
            <div className="mt-2">
              <div className="text-xs neon mb-1">Signed XDR:</div>
              <textarea
                className="w-full text-xs input-retro"
                value={signedXdr}
                readOnly
                rows={3}
                style={{ fontFamily: 'Press Start 2P, monospace', background: '#000', color: '#7CFFB2', border: '1.5px solid #7CFFB2', borderRadius: 0 }}
              />
            </div>
          )}
        </div>
      )}
      {error && <div className="text-xs" style={{ color: '#ff4d4f', fontFamily: 'Press Start 2P, monospace' }}>{error}</div>}
    </div>
  );
} 