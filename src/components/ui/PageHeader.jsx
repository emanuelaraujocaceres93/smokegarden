import React from 'react'

const PageHeader = ({ title, description, actions }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-burnt">{title}</h1>
        {description && <p className="text-grayLight text-sm mt-1">{description}</p>}
      </div>
      {actions && <div className="w-full md:w-auto">{actions}</div>}
    </div>
  )
}

export default PageHeader
