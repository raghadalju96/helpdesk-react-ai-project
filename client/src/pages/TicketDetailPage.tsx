import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import NavBar from "../components/NavBar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type TicketStatus = "open" | "resolved" | "closed";
type TicketCategory =
  | "generalQuestion"
  | "technicalQuestion"
  | "refundRequest"
  | null;

type Ticket = {
  id: number;
  subject: string;
  body: string;
  bodyHtml: string | null;
  fromEmail: string;
  fromName: string;
  status: TicketStatus;
  category: TicketCategory;
  createdAt: string;
  updatedAt: string;
};

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  resolved:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-muted text-muted-foreground",
};

const CATEGORY_LABELS: Record<NonNullable<TicketCategory>, string> = {
  generalQuestion: "General Question",
  technicalQuestion: "Technical Question",
  refundRequest: "Refund Request",
};

async function fetchTicket(id: string): Promise<Ticket> {
  const res = await axios.get<Ticket>(`/api/tickets/${id}`, {
    withCredentials: true,
  });
  return res.data;
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: ticket, isPending, isError } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => fetchTicket(id!),
    enabled: !!id,
  });

  return (
    <div className="flex flex-col flex-1">
      <NavBar />
      <div className="p-8 max-w-3xl mx-auto w-full">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
            <Link to="/tickets">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to tickets
            </Link>
          </Button>

          {isPending && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {isError && (
            <p className="text-destructive text-sm">Failed to load ticket.</p>
          )}

          {ticket && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold mb-2">{ticket.subject}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>
                    From{" "}
                    <span className="text-foreground font-medium">
                      {ticket.fromName}
                    </span>{" "}
                    &lt;{ticket.fromEmail}&gt;
                  </span>
                  <span>·</span>
                  <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                  <span>·</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[ticket.status]}`}
                  >
                    {ticket.status}
                  </span>
                  {ticket.category && (
                    <>
                      <span>·</span>
                      <span className="text-foreground">
                        {CATEGORY_LABELS[ticket.category]}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="border border-border rounded-lg p-5 bg-card text-sm leading-relaxed whitespace-pre-wrap">
                {ticket.body}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
