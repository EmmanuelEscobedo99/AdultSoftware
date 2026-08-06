import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/application/AuthProvider'
import LandingPage from '@/pages/LandingPage'
import NotFoundPage from '@/pages/NotFoundPage'
import LoginPage from '@/features/auth/presentation/pages/LoginPage'
import RegisterPage from '@/features/auth/presentation/pages/RegisterPage'
import ForgotPasswordPage from '@/features/auth/presentation/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/features/auth/presentation/pages/ResetPasswordPage'
import DashboardPage from '@/features/dashboard/presentation/pages/DashboardPage'
import ProfilePage from '@/features/dashboard/presentation/pages/ProfilePage'
import DashboardLayout from '@/features/dashboard/presentation/DashboardLayout'
import FeedPage from '@/features/feed/presentation/pages/FeedPage'
import BrowsePage from '@/features/subscriber/presentation/pages/BrowsePage'
import CreatorProfilePage from '@/features/subscriber/presentation/pages/CreatorProfilePage'
import MySubscriptionsPage from '@/features/subscriber/presentation/pages/MySubscriptionsPage'
import ChatPage from '@/features/chat/presentation/pages/ChatPage'
import StudioPage from '@/features/creator/presentation/pages/StudioPage'
import ContentManagerPage from '@/features/creator/presentation/pages/ContentManagerPage'
import CreatePostPage from '@/features/creator/presentation/pages/CreatePostPage'
import SubscriptionsManagerPage from '@/features/creator/presentation/pages/SubscriptionsManagerPage'
import AiAgentPage from '@/features/creator/presentation/pages/AiAgentPage'
import MyPaymentsPage from '@/features/payments/presentation/pages/MyPaymentsPage'
import CreatorPayoutsPage from '@/features/payments/presentation/pages/CreatorPayoutsPage'
import AdminPaymentsPage from '@/features/payments/presentation/pages/AdminPaymentsPage'
import AdminPage from '@/features/admin/presentation/pages/AdminPage'
import ModerationPage from '@/features/admin/presentation/pages/ModerationPage'
import { ProtectedRoute, GuestRoute, RoleRoute } from './guards'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    element: <GuestRoute />,
    children: [
      { path: '/auth/login', element: <LoginPage /> },
      { path: '/auth/register', element: <RegisterPage /> },
      { path: '/auth/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/auth/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/feed',
        element: (
          <div className="h-screen bg-black">
            <FeedPage />
          </div>
        ),
      },
      {
        element: <DashboardLayout />,
        children: [
          { path: '/browse', element: <BrowsePage /> },
          { path: '/c/:username', element: <CreatorProfilePage /> },
          { path: '/chat', element: <ChatPage /> },
          { path: '/chat/:username', element: <ChatPage /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/dashboard/profile', element: <ProfilePage /> },
          { path: '/dashboard/my-subscriptions', element: <MySubscriptionsPage /> },
          { path: '/dashboard/payments', element: <MyPaymentsPage /> },
          {
            path: '/dashboard/admin',
            element: <RoleRoute roles={['super_admin', 'admin', 'moderator', 'support']} />,
            children: [
              { index: true, element: <AdminPage /> },
              { path: 'moderation', element: <ModerationPage /> },
              { path: 'payments', element: <AdminPaymentsPage /> },
            ],
          },
          {
            path: '/dashboard/creator',
            element: <RoleRoute roles={['creator']} />,
            children: [
              { index: true, element: <StudioPage /> },
              { path: 'content', element: <ContentManagerPage /> },
              { path: 'content/new', element: <CreatePostPage /> },
              { path: 'subscriptions', element: <SubscriptionsManagerPage /> },
              { path: 'chat', element: <ChatPage /> },
              { path: 'ai', element: <AiAgentPage /> },
              { path: 'payouts', element: <CreatorPayoutsPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export function AppRouter() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
