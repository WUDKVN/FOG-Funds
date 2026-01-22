import type { Person } from "@/lib/types"

export const initialPeople: Person[] = [
  {
    id: "1",
    name: "John Smith",
    transactions: [
      {
        id: "t1",
        date: "2023-04-15",
        description: "Dinner payment",
        amount: 45.5,
        comment: "Split bill for dinner at Italian restaurant",
        settled: true,
      },
      {
        id: "t2",
        date: "2023-05-20",
        description: "Movie tickets",
        amount: 25.25,
        comment: "Paid for your movie ticket",
        settled: false,
      },
      {
        id: "t3",
        date: "2023-06-10",
        description: "Grocery shopping",
        amount: 80.0,
        comment: "Groceries for the party",
        settled: false,
      },
    ],
  },
  {
    id: "2",
    name: "Sarah Johnson",
    transactions: [
      {
        id: "t4",
        date: "2023-05-05",
        description: "Utility bill",
        amount: -50.0,
        comment: "Your share of the electricity bill",
        settled: true,
      },
      {
        id: "t5",
        date: "2023-06-15",
        description: "Concert tickets",
        amount: -25.5,
        comment: "Paid me back for concert",
        settled: false,
      },
    ],
  },
  {
    id: "3",
    name: "Michael Brown",
    transactions: [
      {
        id: "t6",
        date: "2023-04-10",
        description: "Car repair",
        amount: 200.0,
        comment: "Helped with car repair costs",
        settled: false,
      },
    ],
  },
  {
    id: "4",
    name: "Emily Davis",
    transactions: [
      {
        id: "t7",
        date: "2023-05-12",
        description: "Rent payment",
        amount: -100.0,
        comment: "Your portion of the rent",
        settled: true,
      },
      {
        id: "t8",
        date: "2023-06-05",
        description: "Internet bill",
        amount: -20.25,
        comment: "Monthly internet bill share",
        settled: false,
      },
    ],
  },
]
