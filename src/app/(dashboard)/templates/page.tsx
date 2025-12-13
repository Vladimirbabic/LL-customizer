import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Designs | Listing Leads',
  description: 'Browse and select a design to customize',
}

// All users should go to /designs now
export default async function TemplatesPage() {
  redirect('/designs')
}
