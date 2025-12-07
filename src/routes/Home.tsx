import hash from "object-hash";
import {
  query,
  createAsync,
  action,
  useSubmission,
  reload,
  useAction,
} from "@solidjs/router";
import DataLoader from "dataloader";
import { createSignal, createResource, Suspense, For, Show } from "solid-js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchUser = async (id: string) => {
  await sleep(1000);
  return Math.random() * 1000 + 1;
};

function App() {
  const [userId, setUserId] = createSignal<string>();
  const [user, { refetch }] = createResource(userId, fetchUser);

  return (
    <div>
      <button onclick={refetch}>Refresh</button>
      <input
        type="number"
        min="1"
        placeholder="Enter Numeric Id"
        onblur={(e) => setUserId(e.currentTarget.value)}
      />

      <Show when={user.state === "refreshing"}>
        <p>Refreshing...</p>
      </Show>
      <Show when={user.state === "unresolved"}>
        <p>Unresolved</p>
      </Show>
      <Show when={user.state === "pending"}>
        <p>Pending</p>
      </Show>
      <Show when={user.state === "ready"}>
        <p>Ready</p>
      </Show>

      <Show when={user()}>
        <p>{JSON.stringify(user())}</p>
      </Show>
    </div>
  );
}

type ObjectInput = Record<string, number>;

const myBatchGetAccounts = async (keys: readonly ObjectInput[]) => {
  await sleep(keys.length * 1000);
  console.log("Batch fetching accounts for keys:", keys);
  return keys.map((key) => {
    return {
      id: key.id,
      name: `Account ${key.id}`,
      balance: Math.floor(Math.random() * 1000) + 1,
    };
  });
};

const accountLoader = new DataLoader(
  (keys: readonly ObjectInput[]) => myBatchGetAccounts(keys),
  {
    cacheKeyFn: (object: ObjectInput) => hash(object),
  }
);

const getAccountQuery = query(async (id: number) => {
  console.log("Fetching account with id:", id);
  const account = await accountLoader.load({ id });
  console.log("Fetched account:", account);

  await sleep(1000);
  return account;
}, "accountStats");

const ids = [1, 2, 3];

function Home() {
  return (
    <div>
      <h1>Hello from Home</h1>

      <For each={ids}>{(id) => <AccountStats id={id} />}</For>
    </div>
  );
}

const reloadAccountAction = action(async ({ id }: { id: number }) => {
  console.log("Action: reloading account with id:", id);
  accountLoader.clear({ id });

  throw reload({ revalidate: [getAccountQuery.keyFor(id)] });
});

const AccountStats = ({ id }: { id: number }) => {
  const stats = createAsync(() => getAccountQuery(id));
  const submission = useSubmission(
    reloadAccountAction.with({ id }),
    ([input]: [number]) => {
      return input === id;
    }
  );
  const reload = useAction(reloadAccountAction.with({ id }));

  return (
    <div>
      <Suspense fallback={<p>Loading account {id}...</p>}>
        <input type="hidden" name="id" value={id} />
        <div
          style={{
            display: "flex",
            gap: "12px",
          }}
        >
          <button
            disabled={submission.pending}
            onclick={async () => {
              await reload();
              console.log("Done revalidation triggered for account", id);
            }}
          >
            Revalidate
          </button>

          <Show when={submission.pending}>
            <span>Refreshing...</span>
          </Show>
        </div>
        <p>Name: {stats()?.name}</p>
        <p>Balance: ${stats()?.balance}</p>
      </Suspense>
    </div>
  );
};

export default App;
