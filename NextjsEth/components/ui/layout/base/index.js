import { Footer, Navbar } from "@components/ui/common";
import { Web3provider } from "@components/providers";

export default function BaseLayout({ children }) {
  return (
    <Web3provider>
      <div className="relative max-w-7xl mx-auto px-4">
        <Navbar />
        <div className="fit">{children}</div>
      </div>
      <Footer />
    </Web3provider>
  );
}
