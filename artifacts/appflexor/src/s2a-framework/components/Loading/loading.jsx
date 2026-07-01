import React from "react"

const Loading = (props) => {
  const { message = "Loading Content..." } = props
  return (
    <div className="h-100 w-100 text-center">
      <div className="position-absolute top-50 start-50 translate-middle">
        <div className="fs-3">{message}</div>
        <div className="d-flex justify-content-center align-items-center gap-2">
          <div className="spinner-border spinner-border-sm" role="status"></div>
          <div className="fs-5">Please wait...</div>
        </div>
      </div>
    </div>
  )
}

export default Loading
