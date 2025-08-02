import { useSession } from 'next-auth/react';
import React from 'react'

const SuperAdminName = () => {
  const { data: session } = useSession();
  return (
    <div>
      <div className="text-white">
          <p><strong>{session?.user.name}</strong></p>
        </div>
    </div>
  )
}

export default SuperAdminName
