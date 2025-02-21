
import React from "react";
import { LayersIcon, Users, Video, Smartphone } from "lucide-react";

interface InputFormProps {
  niche: string;
  audience: string;
  videoType: string;
  platform: string;
  setNiche: (value: string) => void;
  setAudience: (value: string) => void;
  setVideoType: (value: string) => void;
  setPlatform: (value: string) => void;
}

const InputForm = ({
  niche,
  audience,
  videoType,
  platform,
  setNiche,
  setAudience,
  setVideoType,
  setPlatform,
}: InputFormProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
          <LayersIcon className="text-[#4F92FF] w-5 h-5" />
          <div className="flex-1 w-full">
            <label className="text-xs md:text-sm font-medium text-gray-700 block md:mb-2">Niche</label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full p-2 md:p-3 border border-[#EAECEF] rounded-lg bg-[#F9FAFC] text-sm"
              placeholder="Your niche"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
          <Users className="text-[#4F92FF] w-5 h-5" />
          <div className="flex-1 w-full">
            <label className="text-xs md:text-sm font-medium text-gray-700 block md:mb-2">Audience</label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full p-2 md:p-3 border border-[#EAECEF] rounded-lg bg-[#F9FAFC] text-sm"
              placeholder="Target audience"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
          <Video className="text-[#4F92FF] w-5 h-5" />
          <div className="flex-1 w-full">
            <label className="text-xs md:text-sm font-medium text-gray-700 block md:mb-2">Type</label>
            <input
              type="text"
              value={videoType}
              onChange={(e) => setVideoType(e.target.value)}
              className="w-full p-2 md:p-3 border border-[#EAECEF] rounded-lg bg-[#F9FAFC] text-sm"
              placeholder="Video type"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
          <Smartphone className="text-[#4F92FF] w-5 h-5" />
          <div className="flex-1 w-full">
            <label className="text-xs md:text-sm font-medium text-gray-700 block md:mb-2">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full p-2 md:p-3 border border-[#EAECEF] rounded-lg bg-[#F9FAFC] text-sm"
            >
              <option>TikTok</option>
              <option>Instagram Reels</option>
              <option>YouTube Shorts</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputForm;
