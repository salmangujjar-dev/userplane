'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { MoreVertical, UserMinus, Shield } from 'lucide-react';
import Avatar from 'boring-avatars';

const TEAM_MEMBERS = [
  { id: 1, name: 'Olivia Martin', email: 'olivia.martin@email.com', role: 'Owner' },
  { id: 2, name: 'Jackson Lee', email: 'jackson.lee@email.com', role: 'Admin' },
  { id: 3, name: 'Isabella Nguyen', email: 'isabella.nguyen@email.com', role: 'Member' },
  { id: 4, name: 'William Kim', email: 'william.kim@email.com', role: 'Member' },
  { id: 5, name: 'Sofia Davis', email: 'sofia.davis@email.com', role: 'Member' },
  { id: 6, name: 'Emma Wilson', email: 'emma.wilson@email.com', role: 'Member' },
  { id: 7, name: 'James Brown', email: 'james.brown@email.com', role: 'Member' },
];

export function TeamSection() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(TEAM_MEMBERS.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedMembers = TEAM_MEMBERS.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Team</h2>
        <p className="text-sm text-muted-foreground">Manage team members and permissions</p>
      </div>

      <div className="max-w-2xl">
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        size={32}
                        name={member.email}
                        variant="beam"
                        colors={['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51']}
                      />
                      <div>
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{member.role}</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Shield className="h-4 w-4 mr-2" />
                          Change role
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remove member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <p className="text-xs text-muted-foreground">
                Showing {startIndex + 1} to{' '}
                {Math.min(startIndex + itemsPerPage, TEAM_MEMBERS.length)} of {TEAM_MEMBERS.length}{' '}
                members
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
