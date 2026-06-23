import { AppShell } from "@/components/app-shell";
import { OpenQuestsProvider } from "@/context/open-quests";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <OpenQuestsProvider>
      <AppShell>{children}</AppShell>
    </OpenQuestsProvider>
  );
}
