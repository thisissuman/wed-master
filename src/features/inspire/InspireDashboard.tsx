import { FlashList } from "@shopify/flash-list";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";
import Heart from "lucide-react-native/icons/heart";
import Plus from "lucide-react-native/icons/plus";
import Search from "lucide-react-native/icons/search";
import X from "lucide-react-native/icons/x";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";

import {
  AppText,
  ErrorState,
  FilterChip,
  IconButton,
  PageHeader,
  Screen,
  SegmentedControl,
  TextField,
  useKeyboardSettledAction,
} from "@/components/ui";
import {
  feedbackActionDurationMilliseconds,
  useFeedbackStore,
} from "@/features/feedback/feedback-store";
import { useWorkspace } from "@/features/workspace/provider";
import { tokens, useAppTheme } from "@/theme";

import {
  FilteredInspirationEmpty,
  InspirationSkeletonBoard,
  InspirationSourceSheet,
  InspirationTile,
  InspireEmptyState,
} from "./InspireComponents";
import { InspirationActionSheet } from "./InspirationActionSheet";
import { useInspirationDraftStore } from "./draft-store";
import { inspirationErrorMessage } from "./errors";
import {
  isManagedInspirationMediaUri,
  pickInspirationFromCamera,
  pickInspirationFromGallery,
  removeInspirationMedia,
} from "./media";
import {
  useDeleteInspirationMutation,
  useInspirationPages,
  useRestoreInspirationMutation,
  useSetInspirationFavouriteMutation,
} from "./provider";
import {
  inspirationCategories,
  inspirationCategoryLabels,
  type Inspiration,
  type InspirationCategory,
  type InspirationSourceType,
} from "./types";

type BoardFilter = "all" | "favourites" | InspirationCategory;

const largeTabletBoardWidth = 840;

export type InspirationGridSize = "small" | "medium" | "large";
export function inspirationBoardColumnCount(width: number, size: InspirationGridSize = "medium") {
  const medium = width >= largeTabletBoardWidth ? 4 : width >= tokens.layout.expandedWidth ? 3 : 2;
  return Math.max(1, medium + (size === "small" ? 1 : size === "large" ? -1 : 0));
}

export function InspireDashboard() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const workspace = useWorkspace();
  const showFeedback = useFeedbackStore((state) => state.show);
  const setDraft = useInspirationDraftStore((state) => state.setDraft);
  const favouriteMutation = useSetInspirationFavouriteMutation();
  const deleteMutation = useDeleteInspirationMutation();
  const restoreMutation = useRestoreInspirationMutation();
  const [gridSize, setGridSize] = useState<InspirationGridSize>("medium");
  const [filter, setFilter] = useState<BoardFilter>("all");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sourceSheetOpen, setSourceSheetOpen] = useState(false);
  const [pickingSource, setPickingSource] = useState<InspirationSourceType>();
  const [actionTarget, setActionTarget] = useState<Inspiration>();
  const pickerInFlight = useRef(false);
  const pendingSource = useRef<InspirationSourceType | undefined>(undefined);
  const wedding = workspace.data?.wedding;
  const eventNamesById = useMemo(
    () => Object.fromEntries((workspace.data?.events ?? []).map((event) => [event.id, event.name])),
    [workspace.data?.events],
  );
  const inspirationQuery = useInspirationPages({
    weddingId: wedding?.id ?? "",
    category: filter !== "all" && filter !== "favourites" ? filter : undefined,
    favouriteOnly: filter === "favourites" || undefined,
    search: query,
    eventNamesById,
    limit: 30,
  });
  const inspirations = useMemo(
    () => inspirationQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [inspirationQuery.data?.pages],
  );
  const columnCount = inspirationBoardColumnCount(width, gridSize);
  const hasFilter = filter !== "all" || Boolean(query.trim());
  const openSourceSheet = useKeyboardSettledAction(() => setSourceSheetOpen(true));

  const openPermissionSettings = (source: InspirationSourceType) => {
    Alert.alert(
      source === "camera" ? "Camera access is off" : "Photo access is off",
      `Allow access in Settings to ${source === "camera" ? "take" : "choose"} an inspiration photo.`,
      [
        { text: "Not now", style: "cancel" },
        { text: "Open Settings", onPress: () => void Linking.openSettings() },
      ],
    );
  };

  const pickSource = async (source: InspirationSourceType) => {
    if (pickerInFlight.current) return;
    pickerInFlight.current = true;
    setPickingSource(source);
    try {
      const result =
        source === "camera"
          ? await pickInspirationFromCamera()
          : await pickInspirationFromGallery();
      if (result.status === "permission-denied") {
        if (!result.canAskAgain) openPermissionSettings(source);
        else {
          Alert.alert(
            "Permission needed",
            `Mangalya needs permission to ${source === "camera" ? "take" : "choose"} this photo.`,
          );
        }
        return;
      }
      if (result.status === "selected") {
        setDraft(result.draft);
        router.navigate("/inspire/new");
      }
    } catch (error) {
      showFeedback({
        message: inspirationErrorMessage(error),
        actionLabel: "Try again",
        onAction: openSourceSheet.run,
      });
    } finally {
      pickerInFlight.current = false;
      setPickingSource(undefined);
    }
  };

  const requestSource = (source: InspirationSourceType) => {
    if (pickerInFlight.current || pendingSource.current) return;
    pendingSource.current = source;
    setPickingSource(source);
    setSourceSheetOpen(false);
  };

  const launchPendingSource = () => {
    const source = pendingSource.current;
    pendingSource.current = undefined;
    if (source) void pickSource(source);
  };

  const share = async (inspiration: Inspiration) => {
    try {
      if (!isManagedInspirationMediaUri(inspiration.media.detailUri)) {
        throw new Error("This image could not be shared.");
      }
      if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is not available here.");
      await Sharing.shareAsync(inspiration.media.detailUri, {
        dialogTitle: inspiration.title || "Share inspiration",
        mimeType: inspiration.media.mimeType,
      });
    } catch (error) {
      showFeedback({
        message: inspirationErrorMessage(error, "This image could not be shared. Try again."),
      });
    }
  };

  const deleteInspiration = async (inspiration: Inspiration) => {
    try {
      const deleted = await deleteMutation.mutateAsync({
        weddingId: inspiration.weddingId,
        id: inspiration.id,
      });
      let restored = false;
      const cleanup = setTimeout(() => {
        if (!restored) removeInspirationMedia(deleted.media);
      }, feedbackActionDurationMilliseconds);
      showFeedback({
        message: "Inspiration deleted",
        actionLabel: "Undo",
        onAction: async () => {
          restored = true;
          clearTimeout(cleanup);
          await restoreMutation.mutateAsync(deleted);
        },
      });
    } catch (error) {
      showFeedback({ message: inspirationErrorMessage(error) });
    }
  };

  const toggleFavourite = async (inspiration: Inspiration) => {
    try {
      await favouriteMutation.mutateAsync({
        weddingId: inspiration.weddingId,
        id: inspiration.id,
        isFavourite: !inspiration.isFavourite,
      });
    } catch (error) {
      showFeedback({ message: inspirationErrorMessage(error) });
    }
  };

  const clearFilters = () => {
    setFilter("all");
    setQuery("");
  };

  if (workspace.isError) {
    return (
      <Screen className="justify-center p-md">
        <ErrorState
          message="Your wedding workspace could not be opened."
          onRetry={() => void workspace.refetch()}
          title="We could not open Inspire"
        />
      </Screen>
    );
  }

  if (workspace.isLoading || !wedding) {
    return (
      <Screen>
        <View className="gap-lg p-md">
          <PageHeader
            description="Ideas for your perfect celebration"
            heartAccent
            title="Inspire"
          />
        </View>
        <InspirationSkeletonBoard />
      </Screen>
    );
  }

  const header = (
    <View className="gap-md px-md pb-sm pt-md">
      <PageHeader
        actions={
          <View className="flex-row items-center gap-2xs">
            <IconButton
              accessibilityLabel={searchOpen ? "Close inspiration search" : "Search inspiration"}
              icon={searchOpen ? X : Search}
              onPress={() => {
                setSearchOpen((current) => !current);
                if (searchOpen) setQuery("");
              }}
            />
            <IconButton
              accessibilityLabel="Add inspiration"
              disabled={Boolean(pickingSource)}
              icon={Plus}
              onPress={openSourceSheet.run}
            />
          </View>
        }
        description="Ideas for your perfect celebration"
        heartAccent
        title="Inspire"
      />
      <SegmentedControl
        accessibilityLabel="Photo size"
        value={gridSize}
        onChange={setGridSize}
        options={[
          { label: "Small", value: "small" },
          { label: "Medium", value: "medium" },
          { label: "Big", value: "large" },
        ]}
      />
      {searchOpen ? (
        <TextField
          autoCapitalize="none"
          autoCorrect={false}
          icon={Search}
          label="Search inspiration"
          onChangeText={setQuery}
          placeholder="Lavender, mandap, reception…"
          value={query}
        />
      ) : null}
      {pickingSource ? (
        <View
          accessibilityLiveRegion="polite"
          className="flex-row items-center gap-xs rounded-control bg-surfaceMuted px-md py-xs"
        >
          <ActivityIndicator color={theme.colors.secondary} size="small" />
          <AppText tone="muted" variant="caption">
            Preparing your photo…
          </AppText>
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={{ gap: Number.parseInt(tokens.spacing.xs, 10) }}
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
      >
        <FilterChip
          label="All"
          onPress={() => setFilter("all")}
          selected={filter === "all"}
          variant="soft"
        />
        <FilterChip
          icon={Heart}
          label="Favourites"
          onPress={() => setFilter("favourites")}
          selected={filter === "favourites"}
          variant="soft"
        />
        {inspirationCategories.map((category) => (
          <FilterChip
            key={category}
            label={inspirationCategoryLabels[category]}
            onPress={() => setFilter(category)}
            selected={filter === category}
            variant="soft"
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Screen>
      {header}
      {inspirationQuery.isLoading ? (
        <InspirationSkeletonBoard />
      ) : inspirationQuery.isError && !inspirations.length ? (
        <View className="flex-1 justify-center p-md">
          <ErrorState
            message={inspirationErrorMessage(inspirationQuery.error)}
            onRetry={() => void inspirationQuery.refetch()}
            title="We could not open your inspiration board"
          />
        </View>
      ) : !inspirations.length ? (
        hasFilter ? (
          <FilteredInspirationEmpty onClear={clearFilters} />
        ) : (
          <InspireEmptyState columnCount={columnCount} onAdd={openSourceSheet.run} />
        )
      ) : (
        <FlashList
          contentContainerStyle={{
            paddingBottom:
              Number.parseInt(tokens.spacing["4xl"], 10) + tokens.navigation.tabBarHeight,
            paddingHorizontal: Number.parseInt(tokens.spacing.sm, 10),
            paddingTop: Number.parseInt(tokens.spacing.xs, 10),
          }}
          data={inspirations}
          key={`inspiration-grid-${columnCount}`}
          extraData={`${columnCount}-${favouriteMutation.isPending}`}
          keyExtractor={(inspiration) => inspiration.id}
          ListFooterComponent={
            inspirationQuery.isFetchingNextPage ? (
              <View className="items-center py-lg">
                <ActivityIndicator color={theme.colors.secondary} />
              </View>
            ) : null
          }
          masonry
          numColumns={columnCount}
          onEndReached={() => {
            if (inspirationQuery.hasNextPage && !inspirationQuery.isFetchingNextPage) {
              void inspirationQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.6}
          optimizeItemArrangement={false}
          renderItem={({ item }) => (
            <View className="px-2xs pb-xs">
              <InspirationTile
                eventName={item.eventId ? eventNamesById[item.eventId] : undefined}
                inspiration={item}
                onLongPress={() => setActionTarget(item)}
                onPress={() => router.navigate(`/inspire/${item.id}`)}
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
          testID="inspiration-masonry-board"
        />
      )}
      <InspirationSourceSheet
        busySource={pickingSource}
        onAfterClose={launchPendingSource}
        onClose={() => setSourceSheetOpen(false)}
        onSelect={requestSource}
        visible={sourceSheetOpen}
      />
      <InspirationActionSheet
        inspiration={actionTarget}
        onClose={() => setActionTarget(undefined)}
        onDelete={deleteInspiration}
        onEdit={(inspiration) =>
          router.navigate({ pathname: "/inspire/edit", params: { id: inspiration.id } })
        }
        onFavourite={toggleFavourite}
        onShare={share}
      />
    </Screen>
  );
}
