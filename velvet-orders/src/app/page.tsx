"use client";

import dynamic from "next/dynamic";

const TaskHome = dynamic(
  () => import("@/components/task-home").then((mod) => mod.TaskHome),
  { ssr: false },
);

export default function Home() {
  return <TaskHome />;
}
