import axios from "axios";
import { useQuery } from "@tanstack/react-query";
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

async function fetchTickets(): Promise<Ticket[]> {
  const res = await axios.get<{ tickets: Ticket[] }>("/api/tickets", {
    withCredentials: true,
  });
  return res.data.tickets;
}

export default function TicketsPage() {
  const { data: tickets, isPending, isError } = useQuery({
    queryKey: ["tickets"],
    queryFn: fetchTickets,
  });

  return (
    <div className="flex flex-col flex-1">
      <NavBar />
      <div className="p-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-(--text-h)">Tickets</h1>
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
          <p className="text-muted-foreground text-sm">No tickets yet.</p>
        )}

        {tickets && tickets.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">#</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="text-muted-foreground">
                    {ticket.id}
                  </TableCell>
                  <TableCell className="font-medium">{ticket.subject}</TableCell>
                  <TableCell>
                    <div>{ticket.fromName}</div>
                    <div className="text-xs text-muted-foreground">
                      {ticket.fromEmail}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[ticket.status]}`}
                    >
                      {ticket.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {ticket.category ? (
                      CATEGORY_LABELS[ticket.category]
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
