import { RouterProvider } from "react-router";
import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { router } from "./routes";

export default function App() {
  return (
    // reducedMotion="user" — 尊重系統「減少動態效果」設定（前庭障礙友善）
    <MotionConfig reducedMotion="user">
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors closeButton />
    </MotionConfig>
  );
}
