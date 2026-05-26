import { useState, useEffect } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import NavBar from "../components/NavBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TicketStatus = "open" | "resolved" | "closed";
type TicketCategory =
  | "generalQuestion"
  | "technicalQuestion"
  | "refundRequest"
  | null;

type Ticket = {
  id: number;
  subject: string;
  fromEmail: string;
  fromName: string;
  status: TicketStatus;
  category: TicketCategory;
  createdAt: string;
};

type Filters = {
  search: string;
  status: string;
  category: string;
};

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  resolved:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-muted text-muted-foreground",
};

const CATEGORY_LABELS: Record<NonNullable<TicketCategory>, string> = {
  generalQuestion: "General",
  technicalQuestion: "Technical",
  refundRequest: "Refund",
};

async function fetchTickets(
  sorting: SortingState,
  filters: Filters
): Promise<Ticket[]> {
  const sortBy = sorting[0]?.id ?? "createdAt";
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";
  const res = await axios.get<{ tickets: Ticket[] }>("/api/tickets", {
    params: {
      sortBy,
      sortOrder,
      ...(filters.search && { search: filters.search }),
      ...(filters.status && { status: filters.status }),
      ...(filters.category && { category: filters.category }),
    },
    withCredentials: true,
  });
  return res.data.tickets;
}

const columns: ColumnDef<Ticket>[] = [
  {
    id: "id",
    accessorKey: "id",
    header: "#",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.id}</span>
    ),
  },
  {
    id: "subject",
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.subject}</span>
    ),
  },
  {
    id: "fromName",
    accessorKey: "fromName",
    header: "From",
    cell: ({ row }) => (
      <div>
        <div>{row.original.fromName}</div>
        <div className="text-xs text-muted-foreground">
          {row.original.fromEmail}
        </div>
      </div>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[row.original.status]}`}
      >
        {row.original.status}
      </span>
    ),
  },
  {
    id: "category",
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) =>
      row.original.category ? (
        CATEGORY_LABELS[row.original.category]
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Received",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
];

export default function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "",
    category: "",
  });

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(
      () => setFilters((f) => ({ ...f, search: searchInput })),
      300
    );
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: tickets, isPending, isError } = useQuery({
    queryKey: ["tickets", sorting, filters],
    queryFn: () => fetchTickets(sorting, filters),
  });

  const table = useReactTable({
    data: tickets ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col flex-1">
      <NavBar />
      <div className="p-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-(--text-h)">Tickets</h1>
        </div>

        <div className="flex gap-3 mb-4">
          <Input
            placeholder="Search subject or sender…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={filters.status}
            onValueChange={(val) =>
              setFilters((f) => ({ ...f, status: val === "all" ? "" : val }))
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.category}
            onValueChange={(val) =>
              setFilters((f) => ({ ...f, category: val === "all" ? "" : val }))
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="generalQuestion">General</SelectItem>
              <SelectItem value="technicalQuestion">Technical</SelectItem>
              <SelectItem value="refundRequest">Refund</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isPending && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-destructive text-sm">Failed to load tickets</p>
        )}

        {tickets && tickets.length === 0 && (
          <p className="text-muted-foreground text-sm">No tickets found.</p>
        )}

        {tickets && tickets.length > 0 && (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    return (
                      <TableHead
                        key={header.id}
                        className={header.id === "id" ? "w-14" : ""}
                      >
                        <button
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {sorted === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                          )}
                        </button>
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
