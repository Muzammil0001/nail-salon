import React from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { TableBody } from "@mui/material";
import SortableRow from "./SortableRow";

interface Data {
  id: string;
  [key: string]: any;
}

interface DndSortTableProps {
  data: Data[];
  onDragEnd: (sorted: Data[]) => void;
  renderRow: (item: Data) => React.ReactNode[];
}

const DndSortTable: React.FC<DndSortTableProps> = ({
  data,
  onDragEnd,
  renderRow,
}) => {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = data.findIndex((item) => item.id === active.id);
    const newIndex = data.findIndex((item) => item.id === over.id);

    const newList = arrayMove(data, oldIndex, newIndex);
    onDragEnd(newList);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={data.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <TableBody>
          {data?.map((item) => (
            <SortableRow key={item.id} id={item.id}>
              {renderRow(item)}
            </SortableRow>
          ))}
        </TableBody>
      </SortableContext>
    </DndContext>
  );
};

export default DndSortTable;
