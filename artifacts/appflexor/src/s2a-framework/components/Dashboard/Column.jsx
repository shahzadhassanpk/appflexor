import React, { useRef } from "react"
import { useDrag } from "react-dnd"
import { COLUMN } from "./Constants"
import DropZone from "./DropZone"
import Component from "./Component"

const style = {}
const Column = ({ data, components, handleDrop, path, previewMode }) => {

  const ref = useRef(null)

  const [{ isDragging }, drag] = useDrag({
    item: {
      type: COLUMN,
      id: data.id,
      children: data.children,
      path,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const opacity = isDragging ? 0 : 1
  drag(ref)

  const renderComponent = (component, currentPath, previewMode) => {
    return (
      <Component
        key={component.id}
        data={component}
        components={components}
        path={currentPath}
        previewMode={previewMode}
      />
      // <div>{JSON.stringify(component)}</div>
    )
  }

  return (
    <>

      <div
        ref={ref}
        style={{ ...style, opacity }}
        className="base  col text-light"
      >
        {data.children.map((component, index) => {
          const currentPath = `${path}-${index}`

          return (
            <React.Fragment key={component.id}>
              {!previewMode && <DropZone
                data={{
                  path: currentPath,
                  childrenCount: data.children.length,
                }}
                onDrop={handleDrop}
              />
              }
              {component && renderComponent(component, currentPath, previewMode)}
            </React.Fragment>
          )
        })}

      </div>
    </>
  )
}
export default Column
