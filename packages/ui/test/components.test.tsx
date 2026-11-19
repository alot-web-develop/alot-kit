// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { createRef } from "react";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { Button } from "../src/button.js";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../src/card.js";
import { Checkbox } from "../src/checkbox.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../src/dialog.js";
import { Input } from "../src/input.js";
import { Label } from "../src/label.js";
import { cn } from "../src/lib.js";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../src/pagination.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../src/select.js";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../src/table.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../src/tabs.js";

// jsdom does not implement layout observation; Radix uses it to size its hidden input.
beforeAll(() =>
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  ),
);
afterAll(() => vi.unstubAllGlobals());
afterEach(cleanup);
test("consumer classes override defaults and DOM props and refs reach roots", () => {
  const ref = createRef<HTMLInputElement>();
  render(
    <Card data-testid="card">
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Label htmlFor="name">Name</Label>
        <Input id="name" ref={ref} className="h-12" />
      </CardContent>
      <CardFooter>Footer</CardFooter>
    </Card>,
  );
  expect(ref.current).toBe(screen.getByLabelText("Name"));
  expect(ref.current?.className).toContain("h-12");
  expect(ref.current?.className).not.toContain("h-9");
  expect(cn("p-6", false, { "p-2": true })).toBe("p-2");
});
test("asChild preserves link semantics and consumer classes", () => {
  render(
    <Button asChild variant="outline" className="h-12">
      <a href="/orders">Orders</a>
    </Button>,
  );
  const link = screen.getByRole("link");
  expect(link.getAttribute("href")).toBe("/orders");
  expect(link.getAttribute("type")).toBeNull();
  expect(link.className).toContain("h-12");
});
test("checkbox supports keyboard interaction and native form submission", async () => {
  const user = userEvent.setup();
  render(
    <form data-testid="form">
      <Checkbox id="consent" name="consent" value="yes" />
      <Label htmlFor="consent">Consent</Label>
    </form>,
  );
  await user.tab();
  await user.keyboard(" ");
  expect(screen.getByRole("checkbox").getAttribute("aria-checked")).toBe(
    "true",
  );
  expect(
    new FormData(screen.getByTestId("form") as HTMLFormElement).get("consent"),
  ).toBe("yes");
});
test("tabs support keyboard navigation and expose the selected panel", async () => {
  const user = userEvent.setup();
  render(
    <Tabs defaultValue="one">
      <TabsList aria-label="Sections">
        <TabsTrigger value="one">One</TabsTrigger>
        <TabsTrigger value="two">Two</TabsTrigger>
      </TabsList>
      <TabsContent value="one">First panel</TabsContent>
      <TabsContent value="two">Second panel</TabsContent>
    </Tabs>,
  );
  await user.tab();
  await user.keyboard("{ArrowRight}");
  expect(
    screen.getByRole("tab", { name: "Two" }).getAttribute("aria-selected"),
  ).toBe("true");
  expect(screen.getByRole("tabpanel").textContent).toBe("Second panel");
});
test("dialog has a name, traps focus, closes with Escape and restores focus", async () => {
  const user = userEvent.setup();
  render(
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Edit order</DialogTitle>
        <DialogDescription>Change details</DialogDescription>
        <Input aria-label="Order" />
      </DialogContent>
    </Dialog>,
  );
  await user.click(screen.getByText("Open"));
  expect(screen.getByRole("dialog").getAttribute("aria-labelledby")).toBe(
    screen.getByText("Edit order").id,
  );
  expect(document.activeElement).toBe(screen.getByLabelText("Order"));
  await user.tab({ shift: true });
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Close" }),
  );
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(document.activeElement).toBe(screen.getByText("Open"));
});
test("select exposes an accessible trigger and options", () => {
  render(
    <Select defaultValue="a">
      <SelectTrigger aria-label="Kind">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="a">Alpha</SelectItem>
        <SelectItem value="b">Beta</SelectItem>
      </SelectContent>
    </Select>,
  );
  expect(screen.getByRole("combobox", { name: "Kind" }).textContent).toBe(
    "Alpha",
  );
});

test("pagination exposes the current page and composable navigation links", () => {
  render(
    <Pagination aria-label="Pages">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="?page=1" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=2" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="?page=3" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>,
  );
  expect(screen.getByRole("navigation", { name: "Pages" })).toBeDefined();
  expect(
    screen.getByRole("link", { name: "2" }).getAttribute("aria-current"),
  ).toBe("page");
  expect(
    screen.getByRole("link", { name: "Go to next page" }).getAttribute("href"),
  ).toBe("?page=3");
});
test("table renders native accessible table structure", () => {
  render(
    <Table>
      <TableCaption>Orders</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Ada</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  expect(screen.getByRole("table", { name: "Orders" })).toBeDefined();
  expect(screen.getByRole("columnheader").textContent).toBe("Name");
  expect(screen.getByRole("cell").textContent).toBe("Ada");
});
