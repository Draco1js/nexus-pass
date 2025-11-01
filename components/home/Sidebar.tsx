import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

export function Sidebar() {
  return (
    <div className="lg:col-span-1 space-y-4 md:space-y-6">
      <Card className="p-4 md:p-6 bg-linear-to-br from-blue-600 to-purple-700 text-white hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer">
        <h3 className="font-bold text-base md:text-lg mb-2">VIP Packages</h3>
        <p className="text-xs md:text-sm mb-3 md:mb-4">
          Feel the performance, live the moment as a VIP
        </p>
        <Button
          variant="secondary"
          className="w-full text-sm hover:bg-white/90 transition-colors"
        >
          Learn More
        </Button>
      </Card>

      <Card className="p-4 md:p-6 bg-linear-to-br from-green-600 to-teal-700 text-white hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer">
        <h3 className="font-bold text-base md:text-lg mb-2">Ticket Deals</h3>
        <p className="text-xs md:text-sm mb-3 md:mb-4">
          Save up to 50% on select events
        </p>
        <Button
          variant="secondary"
          className="w-full text-sm hover:bg-white/90 transition-colors"
        >
          View Deals
        </Button>
      </Card>

      <Card className="p-4 md:p-6 bg-white hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer">
        <h3 className="font-bold text-base md:text-lg mb-2">
          Sell on NexusPass
        </h3>
        <p className="text-xs md:text-sm mb-3 md:mb-4">
          When you&apos;re out, get other fans in
        </p>
        <Button
          variant="outline"
          className="w-full text-sm hover:bg-[#0A23F0] hover:text-white hover:border-[#0A23F0] transition-colors"
        >
          Get Started
        </Button>
      </Card>
    </div>
  );
}

