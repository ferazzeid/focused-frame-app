import { MobileLayout } from "@/components/MobileLayout";
import { Header } from "@/components/Header";

const Index = () => {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex-1">
        <MobileLayout />
      </div>
    </div>
  );
};

export default Index;
