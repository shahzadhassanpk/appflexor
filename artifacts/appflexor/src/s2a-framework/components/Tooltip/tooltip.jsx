import React from "react"
import { Tooltip } from "../../../public/resources/bootstrap-5.2.3/js/bootstrap.esm.min.js"
import { useEffect } from "react"

const ToolTipComponent = (props) => {
  const { position, title, children } = props
  useEffect(() => {
    // Function to enable tooltips
    const enableTooltip = () => {
      const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]'
      )
      tooltipTriggerList.forEach((tooltipTriggerEl) => {
        new Tooltip(tooltipTriggerEl)
      })
    }

    enableTooltip() // Enable tooltips on initial render

    // Cleanup function to remove tooltips on component unmount
    return () => {
      const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]'
      )
      tooltipTriggerList.forEach((tooltipTriggerEl) => {
        const tooltip = Tooltip.getInstance(tooltipTriggerEl)
        if (tooltip) {
          tooltip.dispose() // Dispose tooltips to avoid memory leaks
        }
      })
    }
  }, [])

  return (
    <div
      data-bs-toggle="tooltip"
      data-bs-placement={position ? position : "top"}
      data-bs-title={title ? title : "please provide tooltip content"}
    >
      {children}
    </div>
  )
}

export default ToolTipComponent
