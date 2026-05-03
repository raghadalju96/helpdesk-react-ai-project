import { useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "agent";
  createdAt: string;
};

const createUserSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const editUserSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().refine((val) => val === "" || val.length >= 8, {
    message: "Password must be at least 8 characters",
  }),
});

type CreateUserData = z.infer<typeof createUserSchema>;
type EditUserData = z.infer<typeof editUserSchema>;

async function fetchUsers(): Promise<User[]> {
  const res = await axios.get<{ users: User[] }>("/api/users", {
    withCredentials: true,
  });
  return res.data.users;
}

async function createUser(data: CreateUserData): Promise<User> {
  const res = await axios.post<{ user: User }>("/api/users", data, {
    withCredentials: true,
  });
  return res.data.user;
}

async function editUser({
  id,
  data,
}: {
  id: string;
  data: EditUserData;
}): Promise<User> {
  const payload: Record<string, string> = { name: data.name, email: data.email };
  if (data.password) payload.password = data.password;
  const res = await axios.patch<{ user: User }>(`/api/users/${id}`, payload, {
    withCredentials: true,
  });
  return res.data.user;
}

async function deleteUser(id: string): Promise<void> {
  await axios.delete(`/api/users/${id}`, { withCredentials: true });
}

export default function UsersPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const {
    data: users,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<EditUserData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsCreateOpen(false);
      resetCreate();
    },
  });

  const editMutation = useMutation({
    mutationFn: editUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeletingUser(null);
    },
  });

  function handleCreateOpenChange(open: boolean) {
    setIsCreateOpen(open);
    if (!open) {
      resetCreate();
      createMutation.reset();
    }
  }

  function handleEditOpen(user: User) {
    resetEdit({ name: user.name, email: user.email, password: "" });
    editMutation.reset();
    setEditingUser(user);
  }

  function handleEditOpenChange(open: boolean) {
    if (!open) {
      setEditingUser(null);
      editMutation.reset();
    }
  }

  function handleDeleteOpenChange(open: boolean) {
    if (!open) {
      setDeletingUser(null);
      deleteMutation.reset();
    }
  }

  const onCreateSubmit = handleCreateSubmit((data) =>
    createMutation.mutate(data)
  );

  const onEditSubmit = handleEditSubmit((data) => {
    if (!editingUser) return;
    editMutation.mutate({ id: editingUser.id, data });
  });

  return (
    <div className="flex flex-col flex-1">
      <NavBar />
      <div className="p-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-(--text-h)">Users</h1>
          <Button onClick={() => setIsCreateOpen(true)}>Create User</Button>
        </div>

        {isPending && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-destructive text-sm">Failed to load users</p>
        )}

        {users && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Member Since</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span
                      className={
                        user.role === "admin"
                          ? "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary text-primary-foreground"
                          : "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground"
                      }
                    >
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEditOpen(user)}
                        aria-label={`Edit ${user.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {user.role !== "admin" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeletingUser(user)}
                          aria-label={`Delete ${user.name}`}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={handleCreateOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreateSubmit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                {...registerCreate("name")}
                placeholder="Jane Smith"
              />
              {createErrors.name && (
                <p className="text-sm text-destructive">
                  {createErrors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                {...registerCreate("email")}
                placeholder="jane@example.com"
              />
              {createErrors.email && (
                <p className="text-sm text-destructive">
                  {createErrors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                {...registerCreate("password")}
                placeholder="Min. 8 characters"
              />
              {createErrors.password && (
                <p className="text-sm text-destructive">
                  {createErrors.password.message}
                </p>
              )}
            </div>
            {createMutation.isError && (
              <p className="text-sm text-destructive">
                {axios.isAxiosError(createMutation.error)
                  ? (createMutation.error.response?.data?.error ??
                    "Failed to create user")
                  : "Failed to create user"}
              </p>
            )}
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full"
            >
              {createMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={editingUser !== null}
        onOpenChange={handleEditOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={onEditSubmit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                {...registerEdit("name")}
                placeholder="Jane Smith"
              />
              {editErrors.name && (
                <p className="text-sm text-destructive">
                  {editErrors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                {...registerEdit("email")}
                placeholder="jane@example.com"
              />
              {editErrors.email && (
                <p className="text-sm text-destructive">
                  {editErrors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-password">
                New Password{" "}
                <span className="text-muted-foreground">(leave blank to keep current)</span>
              </Label>
              <Input
                id="edit-password"
                type="password"
                {...registerEdit("password")}
                placeholder="Min. 8 characters"
              />
              {editErrors.password && (
                <p className="text-sm text-destructive">
                  {editErrors.password.message}
                </p>
              )}
            </div>
            {editMutation.isError && (
              <p className="text-sm text-destructive">
                {axios.isAxiosError(editMutation.error)
                  ? (editMutation.error.response?.data?.error ??
                    "Failed to update user")
                  : "Failed to update user"}
              </p>
            )}
            <Button
              type="submit"
              disabled={editMutation.isPending}
              className="w-full"
            >
              {editMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete confirmation dialog */}
      <Dialog
        open={deletingUser !== null}
        onOpenChange={handleDeleteOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-1">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              {deletingUser?.name}
            </span>
            ? They will no longer be able to log in.
          </p>
          {deleteMutation.isError && (
            <p className="text-sm text-destructive">
              {axios.isAxiosError(deleteMutation.error)
                ? (deleteMutation.error.response?.data?.error ??
                  "Failed to delete user")
                : "Failed to delete user"}
            </p>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setDeletingUser(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deletingUser && deleteMutation.mutate(deletingUser.id)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
