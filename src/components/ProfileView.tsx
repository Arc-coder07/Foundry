import React, { useState, useRef } from "react";
import {
  User,
  Camera,
  Save,
  ArrowLeft,
  Briefcase,
  FileText,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { UserProfile } from "../types";

interface ProfileViewProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onBack: () => void;
}

export function ProfileView({
  profile,
  onUpdateProfile,
  onBack
}: ProfileViewProps) {
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdateProfile({ name, role, bio, avatarUrl });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const getInitials = (n: string) => {
    return n
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-[700px] mx-auto py-12 px-4 space-y-12 pb-24">
      {/* Header */}
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-muted hover:text-on-surface text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to workspace</span>
        </button>
        <div className="flex items-center gap-2.5 pt-2">
          <User className="w-5 h-5 text-primary" />
          <h1 className="font-display text-3xl md:text-4xl text-on-surface font-medium tracking-tight">
            Profile
          </h1>
        </div>
        <p className="text-sm text-text-muted max-w-md leading-relaxed">
          Customize your workspace identity. Your profile is stored locally on
          this device.
        </p>
      </div>

      {/* Avatar Section */}
      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-8 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          {/* Avatar Preview */}
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-surface-container-high border-2 border-outline-variant flex items-center justify-center shadow-lg">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-text-muted font-mono">
                  {getInitials(name || "U")}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
          </div>

          {/* Avatar URL Input */}
          <div className="flex-1 w-full space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider font-semibold">
                Avatar Image URL
              </label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/your-photo.jpg"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-sm text-on-surface outline-none focus:border-primary/50 transition-colors placeholder-on-surface-variant/30"
              />
            </div>
            <p className="text-[10px] text-text-muted font-mono leading-relaxed">
              Paste a URL or click the avatar to upload a local image. Images are
              stored as base64 in your browser.
            </p>
          </div>
        </div>
      </section>

      {/* Profile Fields */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
          <Sparkles className="w-4 h-4 text-on-surface opacity-60" />
          <h2 className="font-label-caps text-xs text-on-surface uppercase tracking-widest font-semibold">
            Identity Details
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <User className="w-3 h-3" />
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-sm text-on-surface outline-none focus:border-primary/50 transition-colors placeholder-on-surface-variant/30 font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Briefcase className="w-3 h-3" />
              Role / Title
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Product Lead, Engineer, Founder..."
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-sm text-on-surface outline-none focus:border-primary/50 transition-colors placeholder-on-surface-variant/30 font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <FileText className="w-3 h-3" />
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="A short description about yourself and what you're building..."
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-sm text-on-surface outline-none focus:border-primary/50 resize-none transition-colors placeholder-on-surface-variant/30 leading-relaxed"
          />
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-lg text-xs font-mono font-bold tracking-wider transition-all shadow-md cursor-pointer ${
            saved
              ? "bg-green-600 text-white"
              : "bg-primary text-on-primary hover:opacity-90"
          }`}
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>SAVED</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>SAVE PROFILE</span>
            </>
          )}
        </button>
      </div>

      {/* Profile Preview Card */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
          <h2 className="font-label-caps text-xs text-on-surface uppercase tracking-widest font-semibold">
            Preview
          </h2>
        </div>
        <div className="p-5 bg-surface-container-low border border-outline-variant rounded-xl flex items-center gap-4 shadow-sm max-w-sm">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center border border-outline-variant flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-text-muted font-mono">
                {getInitials(name || "U")}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate text-on-surface">
              {name || "Your Name"}
            </p>
            <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest">
              {role || "Your Role"}
            </p>
            {bio && (
              <p className="text-[11px] text-text-muted mt-1 line-clamp-2 leading-relaxed">
                {bio}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
