
"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRightIcon, CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Feature {
  name: string
  description: string
  included: boolean
}

interface PricingTier {
  name: string
  price: {
    monthly: number
    yearly: number
  }
  description: string
  features: Feature[]
  highlight?: boolean
  badge?: string
  icon: React.ReactNode
  onSelect?: () => void
  isLoading?: boolean
}

interface PricingSectionProps {
  tiers: PricingTier[]
  className?: string
  isYearly: boolean // Changed to accept isYearly as a prop instead of managing its own state
  onToggleBilling?: (yearly: boolean) => void // Added to handle toggle from parent
}

function PricingSection({ tiers, className, isYearly, onToggleBilling }: PricingSectionProps) {
  const buttonStyles = {
    default: cn(
      "h-12 bg-white dark:bg-zinc-900",
      "hover:bg-zinc-50 dark:hover:bg-zinc-800",
      "text-zinc-900 dark:text-zinc-100",
      "border border-zinc-200 dark:border-zinc-800",
      "hover:border-zinc-300 dark:hover:border-zinc-700",
      "shadow-sm hover:shadow-md",
      "text-sm font-medium",
    ),
    highlight: cn(
      "h-12 bg-zinc-900 dark:bg-zinc-100",
      "hover:bg-zinc-800 dark:hover:bg-zinc-300",
      "text-white dark:text-zinc-900",
      "shadow-[0_1px_15px_rgba(0,0,0,0.1)]",
      "hover:shadow-[0_1px_20px_rgba(0,0,0,0.15)]",
      "font-semibold text-base",
    ),
  }

  const badgeStyles = cn(
    "px-4 py-1.5 text-sm font-medium",
    "bg-zinc-900 dark:bg-zinc-100",
    "text-white dark:text-zinc-900",
    "border-none shadow-lg",
  )

  return (
    <section
      className={cn(
        "relative bg-background text-foreground",
        "py-12 px-4 md:py-24 lg:py-32",
        "overflow-hidden",
        className,
      )}
    >
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-4 mb-12 text-center">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 md:text-4xl text-center">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 text-center">
            Plans that grow with your content strategy
          </p>
          
          {/* Monthly/Yearly toggle positioned here */}
          {onToggleBilling && (
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center bg-white rounded-full p-1 border border-gray-200 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
                <button
                  type="button"
                  className={`px-6 py-2 rounded-full transition-colors ${
                    !isYearly ? 'bg-primary text-white' : 'bg-transparent text-gray-600 dark:text-gray-400'
                  }`}
                  onClick={() => onToggleBilling?.(false)}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  className={`px-6 py-2 rounded-full transition-colors ${
                    isYearly ? 'bg-primary text-white' : 'bg-transparent text-gray-600 dark:text-gray-400'
                  }`}
                  onClick={() => onToggleBilling?.(true)}
                >
                  Yearly
                </button>
              </div>
              {isYearly && <span className="ml-2 text-xs bg-green-100 text-green-800 rounded-full px-3 py-1.5">Save 20%</span>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative group backdrop-blur-sm",
                "rounded-3xl transition-all duration-300",
                "flex flex-col",
                tier.highlight
                  ? "bg-gradient-to-b from-zinc-100/80 to-transparent dark:from-zinc-400/[0.15]"
                  : "bg-white dark:bg-zinc-800/50",
                "border",
                tier.highlight
                  ? "border-zinc-400/50 dark:border-zinc-400/20 shadow-xl"
                  : "border-zinc-200 dark:border-zinc-700 shadow-md",
                "hover:translate-y-0 hover:shadow-lg",
              )}
            >
              {tier.badge && tier.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className={badgeStyles}>{tier.badge}</Badge>
                </div>
              )}

              <div className="p-8 flex-1 text-center">
                <div className="flex items-center justify-center mb-4">
                  <div
                    className={cn(
                      "p-3 rounded-xl",
                      tier.highlight
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
                    )}
                  >
                    {tier.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  {tier.name}
                </h3>

                <div className="mb-6">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                      {tier.price.monthly === 0 ? 'Free' : `£${isYearly ? tier.price.yearly : tier.price.monthly}`}
                    </span>
                    {tier.price.monthly > 0 && (
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        /{isYearly ? "year" : "month"}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {tier.description}
                  </p>
                </div>

                <div className="space-y-4">
                  {tier.features.map((feature) => (
                    <div key={feature.name} className="flex gap-4 items-center justify-center">
                      <div
                        className={cn(
                          "p-0.5 rounded-full transition-colors duration-200",
                          feature.included
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-zinc-400 dark:text-zinc-600",
                        )}
                      >
                        <CheckIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {feature.name}
                        </div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          {feature.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 pt-0 mt-auto">
                <Button
                  className={cn(
                    "w-full relative transition-all duration-300",
                    tier.highlight
                      ? buttonStyles.highlight
                      : buttonStyles.default,
                  )}
                  onClick={tier.onSelect}
                  disabled={tier.isLoading}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {tier.isLoading ? (
                      "Processing..."
                    ) : tier.highlight ? (
                      <>
                        Get {tier.name}
                        <ArrowRightIcon className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        {tier.name === "Free" ? "Sign up free" : "Get started"}
                        <ArrowRightIcon className="w-4 h-4" />
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export { PricingSection }
