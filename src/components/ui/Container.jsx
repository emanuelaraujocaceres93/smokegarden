import React from 'react'

const Container = ({ children, className = '', fluid = false }) => {
  return (
    <div className={${fluid ? 'w-full' : 'container mx-auto px-4 md:px-6'} }>
      {children}
    </div>
  )
}

export default Container
