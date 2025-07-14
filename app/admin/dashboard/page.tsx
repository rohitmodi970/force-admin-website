// app/admin/dashboard/page.tsx
import React from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/Dashboard/AdminDashboard'
import { useSession } from 'next-auth/react'
  import { authOptions } from '@/utilities/auth'
const AdminDashboardPage = async () => {
  const session = await getServerSession(authOptions)

  // Check if user is authenticated and is admin
  if (!session || !session.user ) {
    redirect('/admin/login')
  }

  return <AdminDashboard  />
}

export default AdminDashboardPage