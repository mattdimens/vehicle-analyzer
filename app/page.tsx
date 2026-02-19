import type { Metadata } from "next"
import { VehicleAnalyzer } from "@/components/home/vehicle-analyzer"
import { RelatedPages } from "@/components/ui/related-pages"

export const metadata: Metadata = {
  title: "Find Vehicle Fitment, Parts, & Accessories From an Image | Visual Fitment",
  description:
    "Instantly identify vehicle fitment, parts, and accessories just from a photo. Upload an image of any car or truck to get a detailed analysis.",
}

// HowTo JSON-LD — describes the 3-step process shown on the homepage
const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Identify Vehicle Fitment and Parts From a Photo",
  description:
    "Use Visual Fitment to upload a vehicle image, choose an analysis type, and get instant fitment and product results powered by AI.",
  step: [
    {
      "@type": "HowToStep",
      name: "Upload Vehicle Image",
      text: "Upload the vehicle image you'd like to analyze. Drag and drop or select from your device.",
      position: 1,
    },
    {
      "@type": "HowToStep",
      name: "Choose Analysis",
      text: "Choose from three separate analyses: Analyze Fitment to identify your vehicle's make, model, trim, and year; Detect Products to identify aftermarket parts and accessories; or Fitment & Products for a complete analysis.",
      position: 2,
    },
    {
      "@type": "HowToStep",
      name: "Get Instant Results",
      text: "Analysis results are organized into a comprehensive table detailing your vehicle's fitment specifications, detected parts, and compatibility data in seconds.",
      position: 3,
    },
  ],
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <VehicleAnalyzer
        showCategories={true}
        relatedContent={
          <RelatedPages
            items={[
              {
                title: "Part Identifier",
                description: "Identify individual car parts from a photo — perfect for loose parts or unknown components.",
                href: "/part-identifier"
              },
              {
                title: "Wheels & Rims Analysis",
                description: "Get bolt pattern, offset, and fitment data for wheels. Find the perfect stance.",
                href: "/wheels-rims"
              },
              {
                title: "Truck Bed Covers",
                description: "Measure your bed length and cab style to find compatible tonneau covers.",
                href: "/truck-bed-covers"
              }
            ]}
          />
        }
      />
    </>
  )
}