import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'HR Management System',
  description: 'Employee Leave & Attendance Management System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}