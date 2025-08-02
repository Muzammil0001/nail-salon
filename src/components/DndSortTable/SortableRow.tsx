import React from "react";
import { TableRow } from "@mui/material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableRowProps {
  id: string;
  children: React.ReactNode;
}

const SortableRow: React.FC<SortableRowProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style} hover>
      {React.Children.map(children, (child, index) => {
        if (index === 0 && React.isValidElement(child)) {
          const cellChildren = React.Children.map(child.props.children, (innerChild) => {
            if (
              React.isValidElement(innerChild) &&
              (innerChild.props as any)["data-drag-handle"]
            ) {
              const cloned = React.cloneElement(
                innerChild as React.ReactElement,
                {
                  ...(innerChild.props as any),
                  ...listeners,
                  ...attributes,
                  ref: (node: HTMLElement | null) => {
                    setActivatorNodeRef(node);

                    const originalRef = (innerChild as any).ref;
                    if (typeof originalRef === "function") {
                      originalRef(node);
                    } else if (
                      originalRef &&
                      typeof originalRef === "object" &&
                      "current" in originalRef
                    ) {
                      (originalRef as React.MutableRefObject<HTMLElement | null>).current = node;
                    }
                  },
                }
              );

              return cloned;
            }

            return innerChild;
          });

          return React.cloneElement(child, {
            ...child.props,
            children: cellChildren,
          });
        }

        return child;
      })}
    </TableRow>
  );
};

export default SortableRow;
