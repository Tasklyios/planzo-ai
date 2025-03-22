import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useState } from "react"

import { Hero } from "@/components/Hero"
import { LandingNavbar } from "@/components/LandingNavbar"
import { AccountFooter } from "@/components/AccountFooter"

export default function Index() {
  return (
    <>
      <LandingNavbar />
      <Hero />
      <AccountFooter />
    </>
  )
}
