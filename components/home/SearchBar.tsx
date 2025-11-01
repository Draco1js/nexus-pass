"use client";

import { Search, MapPin, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "~/lib/utils";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";

export function SearchBar() {
  const [selectedCity, setSelectedCity] = useState("");
  const [date, setDate] = useState<DateRange | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const cities = useQuery(api.events.getCities, {}) || [];

  const handleSearch = () => {
    console.log({ selectedCity, date, searchQuery });
  };

  return (
    <div className={`bg-white rounded-sm w-full transition-all duration-200 ${isFocused ? 'ring-2 ring-[#0A23F0] shadow-lg' : 'shadow-md'}`}>
      <div className="flex flex-col md:flex-row md:items-stretch">
        {/* Location and Date - side by side on mobile, inline on desktop */}
        <div className="flex border-b md:border-b-0 border-gray-200">
          {/* Location */}
          <div className="flex items-center gap-3 flex-1 p-4 border-r border-gray-200 md:min-w-[220px]">
            <MapPin className="size-4 text-[#0A23F0] shrink-0" />
            <div className="flex flex-col flex-1 min-w-0">
              <label className="text-xs font-bold text-gray-900 uppercase mb-1">
                LOCATION
              </label>
              <Popover open={cityOpen} onOpenChange={setCityOpen}>
                <PopoverTrigger asChild>
                  <button
                    onClick={() => setCityOpen(true)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="flex items-center justify-between w-full text-left text-sm text-gray-900 hover:opacity-80 transition-opacity min-h-[20px]"
                  >
                    <span className={cn("truncate", selectedCity ? "" : "text-gray-400")}>
                      {selectedCity || "City or Zip Code"}
                    </span>
                    <ChevronDown className="size-4 text-gray-400 ml-2 shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start" sideOffset={0} alignOffset={-36}>
                  <Command>
                    <CommandInput placeholder="Search city..." />
                    <CommandList>
                      <CommandEmpty>No city found.</CommandEmpty>
                      <CommandGroup>
                        {cities.map((city) => (
                          <CommandItem
                            key={city}
                            value={city}
                            onSelect={() => {
                              setSelectedCity(city);
                              setCityOpen(false);
                            }}
                          >
                            {city}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-3 flex-1 p-4 md:min-w-[260px]">
            <CalendarIcon className="size-4 text-[#0A23F0] shrink-0" />
            <div className="flex flex-col flex-1 min-w-0">
              <label className="text-xs font-bold text-gray-900 uppercase mb-1">
                DATES
              </label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <button
                    onClick={() => setDateOpen(true)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={cn(
                      "flex items-center gap-2 w-full text-left text-sm transition-opacity hover:opacity-80 min-h-[20px]",
                      !date && "text-gray-400",
                      date && "text-gray-900"
                    )}
                  >
                    <span className="truncate flex-1 min-w-0">
                      {date?.from ? (
                        date.to ? (
                          <>
                            <span className="md:hidden">
                              {format(date.from, "M/d")} - {format(date.to, "M/d")}
                            </span>
                            <span className="hidden md:inline">
                              {format(date.from, "MMM dd")} - {format(date.to, "MMM dd")}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="md:hidden">{format(date.from, "M/d")}</span>
                            <span className="hidden md:inline">{format(date.from, "MMM dd")}</span>
                          </>
                        )
                      ) : (
                        "All Dates"
                      )}
                    </span>
                    <ChevronDown className="size-4 text-gray-400 shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" sideOffset={0} alignOffset={-36}>
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-[#0A23F0]/10 rounded-md",
                      day_range_start: "day-range-start bg-[#0A23F0] text-white hover:bg-[#0A23F0] hover:text-white",
                      day_range_end: "day-range-end bg-[#0A23F0] text-white hover:bg-[#0A23F0] hover:text-white",
                      day_selected: "bg-[#0A23F0] text-white hover:bg-[#0A23F0] hover:text-white focus:bg-[#0A23F0] focus:text-white",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_range_middle: "aria-selected:bg-[#0A23F0]/20 aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Search field */}
        <div className="flex items-stretch md:flex-1">
          <div className="flex items-center gap-3 flex-1 p-4 relative">
            <Search className="size-4 text-[#0A23F0] shrink-0 hidden md:block" />
            <div className="flex flex-col flex-1 relative min-w-0">
              <label className="text-xs font-bold text-gray-900 uppercase mb-1">
                SEARCH
              </label>
              <input
                type="text"
                placeholder="Artist, Event or Venue"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="border-0 bg-transparent p-0 h-auto text-sm text-gray-900 placeholder:text-gray-400 pr-10 md:pr-0 focus:outline-none min-h-[20px]"
              />
              <button
                onClick={handleSearch}
                className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 mt-2.5 p-1.5 hover:opacity-80 transition-opacity"
              >
                <Search className="size-5 text-[#0A23F0]" />
              </button>
            </div>
          </div>
          {/* Search Button - looks like it's inside with white space */}
          <div className="hidden md:flex items-center pr-3">
            <button
              onClick={handleSearch}
              className="bg-[#0A23F0] hover:bg-[#0819c7] text-white font-bold px-8 py-2.5 rounded-sm transition-all items-center justify-center text-base shadow-sm"
            >
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
