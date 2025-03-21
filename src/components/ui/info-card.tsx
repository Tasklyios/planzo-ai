
"use client";

import {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { cn } from "@/lib/utils";
import React from "react";

interface InfoCardTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface InfoCardDescriptionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const InfoCardTitle = React.memo(
  ({ children, className, ...props }: InfoCardTitleProps) => {
    return (
      <div className={cn("font-medium mb-1", className)} {...props}>
        {children}
      </div>
    );
  }
);
InfoCardTitle.displayName = "InfoCardTitle";

const InfoCardDescription = React.memo(
  ({ children, className, ...props }: InfoCardDescriptionProps) => {
    return (
      <div
        className={cn("text-muted-foreground leading-4", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
InfoCardDescription.displayName = "InfoCardDescription";

interface CommonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface InfoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  storageKey?: string;
  dismissType?: "once" | "forever" | "timed";
  dismissDuration?: number; // Duration in milliseconds
}

type InfoCardContentProps = CommonCardProps;
type InfoCardFooterProps = CommonCardProps;
type InfoCardDismissProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  onDismiss?: () => void;
};
type InfoCardActionProps = CommonCardProps;

const InfoCardContent = React.memo(
  ({ children, className, ...props }: InfoCardContentProps) => {
    return (
      <div className={cn("flex flex-col gap-1 text-xs", className)} {...props}>
        {children}
      </div>
    );
  }
);
InfoCardContent.displayName = "InfoCardContent";

interface MediaItem {
  type?: "image" | "video";
  src: string;
  alt?: string;
  className?: string;
  [key: string]: any;
}

interface InfoCardMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  media: MediaItem[];
  loading?: "eager" | "lazy";
  shrinkHeight?: number;
  expandHeight?: number;
}

const InfoCardImageContext = createContext<{
  handleMediaLoad: (mediaSrc: string) => void;
  setAllImagesLoaded: (loaded: boolean) => void;
}>({
  handleMediaLoad: () => {},
  setAllImagesLoaded: () => {},
});

const InfoCardContext = createContext<{
  isHovered: boolean;
  onDismiss: () => void;
}>({
  isHovered: false,
  onDismiss: () => {},
});

function InfoCard({
  children,
  className,
  storageKey,
  dismissType = "once",
  dismissDuration = 1000 * 60 * 60 * 24, // Default: 24 hours
}: InfoCardProps) {
  if ((dismissType === "forever" || dismissType === "timed") && !storageKey) {
    throw new Error(
      'A storageKey must be provided when using dismissType="forever" or dismissType="timed"'
    );
  }

  const [isHovered, setIsHovered] = useState(false);
  const [allImagesLoaded, setAllImagesLoaded] = useState(true);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    
    if (dismissType === "forever") {
      return localStorage.getItem(storageKey!) === "dismissed";
    } else if (dismissType === "timed") {
      const savedDismissal = localStorage.getItem(storageKey!);
      if (savedDismissal) {
        try {
          const dismissalData = JSON.parse(savedDismissal);
          const now = new Date().getTime();
          return now < dismissalData.expiry;
        } catch (e) {
          return false;
        }
      }
    }
    return false;
  });

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    if (dismissType === "forever") {
      localStorage.setItem(storageKey!, "dismissed");
    } else if (dismissType === "timed") {
      const now = new Date().getTime();
      const dismissalData = {
        dismissed: true,
        expiry: now + dismissDuration,
      };
      localStorage.setItem(storageKey!, JSON.stringify(dismissalData));
    }
  }, [storageKey, dismissType, dismissDuration]);

  const imageContextValue = useMemo(
    () => ({
      handleMediaLoad: () => {},
      setAllImagesLoaded,
    }),
    [setAllImagesLoaded]
  );

  const cardContextValue = useMemo(
    () => ({
      isHovered,
      onDismiss: handleDismiss,
    }),
    [isHovered, handleDismiss]
  );

  return (
    <InfoCardContext.Provider value={cardContextValue}>
      <InfoCardImageContext.Provider value={imageContextValue}>
        {!isDismissed && (
          <div
            className={cn("group rounded-lg border bg-card p-3", className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {children}
          </div>
        )}
      </InfoCardImageContext.Provider>
    </InfoCardContext.Provider>
  );
}

const InfoCardFooter = ({ children, className }: InfoCardFooterProps) => {
  const { isHovered } = useContext(InfoCardContext);

  return (
    <div
      className={cn(
        "flex justify-between text-xs text-muted-foreground mt-2",
        className,
        isHovered ? "opacity-100" : "opacity-0"
      )}
      style={{
        transition: "opacity 0.3s ease"
      }}
    >
      {children}
    </div>
  );
};

const InfoCardDismiss = React.memo(
  ({ children, className, onDismiss, ...props }: InfoCardDismissProps) => {
    const { onDismiss: contextDismiss } = useContext(InfoCardContext);

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      onDismiss?.();
      contextDismiss();
    };

    return (
      <div
        className={cn("cursor-pointer", className)}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);
InfoCardDismiss.displayName = "InfoCardDismiss";

const InfoCardAction = React.memo(
  ({ children, className, ...props }: InfoCardActionProps) => {
    return (
      <div className={cn("", className)} {...props}>
        {children}
      </div>
    );
  }
);
InfoCardAction.displayName = "InfoCardAction";

const InfoCardMedia = ({
  media = [],
  className,
  loading = undefined,
  shrinkHeight = 75,
  expandHeight = 150,
}: InfoCardMediaProps) => {
  const { isHovered } = useContext(InfoCardContext);
  const { setAllImagesLoaded } = useContext(InfoCardImageContext);
  const loadedMedia = useRef(new Set());

  const handleMediaLoad = (mediaSrc: string) => {
    loadedMedia.current.add(mediaSrc);
    if (loadedMedia.current.size === Math.min(2, media.slice(0, 2).length)) {
      setAllImagesLoaded(true);
    }
  };

  const processedMedia = useMemo(
    () =>
      media.slice(0, 2).map((item) => ({
        ...item,
        type: item.type || "image",
      })),
    [media]
  );

  const displayMedia = processedMedia;

  useEffect(() => {
    if (media.length > 0) {
      setAllImagesLoaded(false);
      loadedMedia.current.clear();
    } else {
      setAllImagesLoaded(true); // No media to load
    }
  }, [media.length, setAllImagesLoaded]);

  const mediaCount = displayMedia.length;

  if (media.length === 0) return null;

  return (
    <InfoCardImageContext.Provider
      value={{
        handleMediaLoad,
        setAllImagesLoaded,
      }}
    >
      <div
        className={cn("relative mt-2 rounded-md overflow-hidden flex justify-center", className)}
        style={{
          height: isHovered ? expandHeight : shrinkHeight,
          transition: "height 0.3s ease",
        }}
      >
        <div className="relative h-full w-full flex justify-center items-center">
          {displayMedia.map((item, index) => {
            if (!isHovered && index > 0) {
              return null;
            }

            const {
              type,
              src,
              alt,
              className: itemClassName,
              ...mediaProps
            } = item;

            const style: React.CSSProperties = {
              position: 'absolute' as const,
              zIndex: mediaCount - index,
              transform: isHovered
                ? `translateY(${index * -5}px) rotate(${(index - (mediaCount === 2 ? 0.5 : 1)) * 5}deg) translateX(${(index - (mediaCount === 2 ? 0.5 : 1)) * 8}px) scale(${0.95 + index * 0.02})`
                : index === 0 ? "translateY(0) rotate(0) translateX(0) scale(1)" : "translateY(5px) rotate(0) translateX(0) scale(0.95)",
              transition: "transform 0.3s ease, opacity 0.3s ease",
              opacity: 1,
              width: '90%',
              maxHeight: '100%',
            };

            return (
              <div
                key={src}
                style={style}
                className="flex justify-center"
              >
                {type === "video" ? (
                  <video
                    src={src}
                    className={cn(
                      "rounded-md border border-border object-cover shadow-sm",
                      itemClassName
                    )}
                    onLoadedData={() => handleMediaLoad(src)}
                    preload="metadata"
                    muted
                    playsInline
                    {...mediaProps}
                  />
                ) : (
                  <img
                    src={src}
                    alt={alt || "Card media"}
                    className={cn(
                      "rounded-md border border-border object-cover shadow-sm",
                      itemClassName
                    )}
                    onLoad={() => handleMediaLoad(src)}
                    loading={loading}
                    {...mediaProps}
                  />
                )}
              </div>
            );
          })}
        </div>

        {!isHovered && (
          <div
            className="absolute right-0 bottom-0 left-0 h-10 bg-gradient-to-b from-transparent to-card"
          />
        )}
      </div>
    </InfoCardImageContext.Provider>
  );
};

export {
  InfoCard,
  InfoCardTitle,
  InfoCardDescription,
  InfoCardContent,
  InfoCardMedia,
  InfoCardFooter,
  InfoCardDismiss,
  InfoCardAction,
};
