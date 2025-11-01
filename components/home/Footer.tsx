export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 md:py-12 mt-12 md:mt-16">
      <div className="px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
          <div>
            <h4 className="font-bold mb-3 md:mb-4 text-sm md:text-base">
              Top Cities
            </h4>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Karachi
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Lahore
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Islamabad
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Faisalabad
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 md:mb-4 text-sm md:text-base">
              Helpful Links
            </h4>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Help/FAQ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Sell
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  My Account
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 md:mb-4 text-sm md:text-base">
              About Us
            </h4>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Boost Your Event
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 md:mb-4 text-sm md:text-base">
              Friends & Partners
            </h4>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm text-gray-400">
              <li>
                <div className="flex flex-row items-center gap-4">
                  <a
                    href="https://polar.sh"
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <img
                      src="/polar.png"
                      alt="Polar"
                      className="h-4 brightness-0 invert opacity-70"
                    />
                  </a>
                  <a
                    href="https://aws.amazon.com"
                    className="hover:text-white transition-colors"
                  >
                    <img
                      src="/aws.png"
                      alt="AWS"
                      className="h-10 brightness-0 invert opacity-70"
                    />
                  </a>
                  <a
                    href="https://convex.dev"
                    className="hover:text-white transition-colors"
                  >
                    <img
                      src="/convex.svg"
                      alt="Convex"
                      className="h-10 brightness-0 invert opacity-70"
                    />
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 md:pt-8 text-center text-xs md:text-sm text-gray-400">
          <p>&copy; 2025 NexusPass. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
