"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Loader2, AlertCircle, Eye, Download, X } from "lucide-react";

interface ProofImageProps {
  proofPath?: string | null;
  className?: string;
  thumbnail?: boolean;
}

export default function ProofImage({
  proofPath,
  className = "w-full h-48 rounded-xl object-cover",
  thumbnail = false,
}: ProofImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!proofPath) {
      setImageUrl(null);
      return;
    }

    // If it's already a full HTTP URL, use it directly
    if (proofPath.startsWith("http://") || proofPath.startsWith("https://")) {
      setImageUrl(proofPath);
      return;
    }

    // Otherwise, fetch a temporary signed URL from Supabase Storage
    const fetchSignedUrl = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase.storage
          .from("proofs")
          .createSignedUrl(proofPath, 3600); // 1 hour expiration

        if (err) throw err;
        if (data?.signedUrl) {
          setImageUrl(data.signedUrl);
        } else {
          throw new Error("Could not generate signed URL");
        }
      } catch (err: any) {
        console.error("[ProofImage] Error creating signed URL:", err.message);
        setError("Failed to load proof image");
      } finally {
        setLoading(false);
      }
    };

    fetchSignedUrl();
  }, [proofPath]);

  if (!proofPath) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-slate-900/30 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
        No receipt proof attached
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 bg-slate-900/30 border border-slate-900 rounded-xl min-h-[120px]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-950/20 border border-red-900/30 rounded-xl text-xs text-red-400">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error || "Could not retrieve proof details"}</span>
      </div>
    );
  }

  if (thumbnail) {
    return (
      <>
        <div 
          onClick={() => setLightboxOpen(true)}
          className="group relative cursor-pointer overflow-hidden rounded-lg border border-slate-800 bg-slate-900 w-10 h-10 shrink-0 flex items-center justify-center transform active:scale-95 transition-all shadow-md"
        >
          <img src={imageUrl} alt="Receipt proof thumbnail" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Eye className="w-3 h-3 text-white" />
          </div>
        </div>

        {/* Lightbox Modal */}
        {lightboxOpen && (
          <Lightbox 
            imageUrl={imageUrl} 
            title="Receipt Proof Verification" 
            onClose={() => setLightboxOpen(false)} 
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="relative group overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
        <img 
          src={imageUrl} 
          alt="Receipt proof document" 
          className={`${className} cursor-pointer transition-transform duration-500 hover:scale-102`}
          onClick={() => setLightboxOpen(true)}
        />
        
        {/* Hover overlay controls */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            onClick={() => setLightboxOpen(true)}
            className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-200 hover:text-white transition-all transform hover:scale-110 active:scale-90"
            title="View Fullscreen"
          >
            <Eye className="w-4 h-4" />
          </button>
          <a
            href={imageUrl}
            download="receipt_proof.jpg"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-200 hover:text-white transition-all transform hover:scale-110 active:scale-90"
            title="Download Document"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <Lightbox 
          imageUrl={imageUrl} 
          title="Receipt Proof Verification" 
          onClose={() => setLightboxOpen(false)} 
        />
      )}
    </>
  );
}

// Lightbox modal component
function Lightbox({ imageUrl, title, onClose }: { imageUrl: string; title: string; onClose: () => void }) {
  // Prevent background scrolling while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />
      
      <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center justify-center z-10 space-y-4">
        {/* Header toolbar */}
        <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900/60 border border-slate-800 backdrop-blur rounded-2xl">
          <span className="text-xs font-bold text-slate-200 tracking-tight">{title}</span>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              title="Open original"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-950 hover:bg-red-950/30 border border-slate-800 hover:border-red-900/30 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
              title="Close modal"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scaled image viewport */}
        <div className="w-full overflow-auto max-h-[75vh] flex items-center justify-center rounded-2xl bg-slate-900/20 border border-slate-900/60 shadow-2xl p-2 select-text">
          <img 
            src={imageUrl} 
            alt="Fullscreen Receipt Proof" 
            className="max-w-full max-h-[70vh] object-contain rounded-xl select-all" 
          />
        </div>
      </div>
    </div>
  );
}
