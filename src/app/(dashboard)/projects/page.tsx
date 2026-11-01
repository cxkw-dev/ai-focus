import { redirect } from 'next/navigation'

// There's no all-projects page: projects are reached from the side nav. Old links land on notes, like the root.
export default function ProjectsIndex() {
  redirect('/notes')
}
