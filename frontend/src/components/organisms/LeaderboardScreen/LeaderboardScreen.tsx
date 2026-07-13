import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  ViewStyle,
  ImageStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLeaderboard, useUserStats } from "../../../api/hooks/useJaap";
import { useDeities } from "../../../api/hooks/useContent";
import { getFullImageUrl } from "../../../utils";
import { LeaderboardUser } from "../../../api/services";
import { useAuthStore } from "../../../store";
import { useTranslation } from "react-i18next";
import * as hapticUtils from '../../../utils/hapticUtils';
import { Button } from "../../atoms/Button";
import { HeaderLogo } from "../../molecules";

// Avatar component that handles both image and fallback
interface AvatarProps {
  source?: { uri: string | null } | null;
  hasImage: boolean;
  gender?: string;
  style?: any;
}

const AvatarImage: React.FC<AvatarProps> = ({ source, hasImage, gender, style }) => {
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [source?.uri]);

  if (hasImage && source?.uri && !imageError) {
    return (
      <Image
        source={{ uri: source.uri }}
        style={style}
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback: colored circle with user icon
  const isFemale = gender?.toLowerCase() === 'female';
  const backgroundColor = isFemale ? '#FFB6C1' : '#ADD8E6';
  const emoji = isFemale ? '👧' : '👦';

  // Scale font size based on width if provided
  const fontSize = style?.width ? Number(style.width) * 0.45 : 24;

  return (
    <View style={[
      style,
      {
        backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
      }
    ]}>
      <Text style={{ fontSize }}>{emoji}</Text>
    </View>
  );
};

interface LeaderboardScreenProps {
  onBack: () => void;
  showContinueButton?: boolean;
  onContinue?: () => void;
  hideHeader?: boolean;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  onBack,
  showContinueButton = false,
  onContinue,
  hideHeader = false,
}) => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const { data: leaderboardData, isLoading: loading } = useLeaderboard(1, 20);
  const { data: myStats } = useUserStats();
  const { data: apiDeities } = useDeities();
  const leaderboard = leaderboardData?.items ?? [];
  const { t, i18n } = useTranslation();

  const lang = i18n.language as 'en' | 'hi' | 'sa';
  const favoriteDeity = apiDeities?.find(d =>
    d._id === user?.favoriteDeity ||
    d.slug === user?.favoriteDeity ||
    d.name?.en === user?.favoriteDeity ||
    d.name?.hi === user?.favoriteDeity
  );

  // Map deity slug to bundled asset image if available, else use remote URL
  const getDeitySource = (deity: any) => {
    // If no specific deity is found, default to Hanuman
    if (!deity) return require("../../../../assets/load-hanuman.png");

    // 1. Prefer the remote image URL from database if it exists
    if (deity.imageUrl) {
      return { uri: getFullImageUrl(deity.imageUrl) };
    }

    // 2. Fallback to local assets map for known slugs or names
    const slug = (deity.slug || "").toLowerCase();
    const deitySlugMap: Record<string, any> = {
      'shani': require("../../../../assets/load-shani.png"),
      'hanuman': require("../../../../assets/load-hanuman.png"),
      'shiva': require("../../../../assets/load-shiv.png"),
      'shiv': require("../../../../assets/load-shiv.png"),
      'ganesh': require("../../../../assets/load-ganesh.png"),
      'ganesha': require("../../../../assets/load-ganesh.png"),
    };

    return deitySlugMap[slug] || require("../../../../assets/main-diya.webp");
  };

  const hasFavoriteDeity = Boolean(favoriteDeity || user?.favoriteDeity);
  const deitySource = getDeitySource(favoriteDeity);
  const deityName = favoriteDeity?.name ? (favoriteDeity.name[lang] || favoriteDeity.name.en) : (user?.favoriteDeity || "Hanuman");

  const getName = (u: LeaderboardUser) => {
    const full = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    if (full) return full;
    // If username looks like an email, show only the part before @
    if (u.username) {
      return u.username.includes('@') ? u.username.split('@')[0] : u.username;
    }
    return t('leaderboardScreen.userFallback');
  };
  const getUserLevel = (u: LeaderboardUser) => Math.floor(u.totalBeads / 1000) + 1;

  const getAvatar = (u: LeaderboardUser): { uri: string | null; hasImage: boolean; gender?: string } => {
    if (u.avatar) {
      const fullUrl = getFullImageUrl(u.avatar);
      if (fullUrl) {
        return { uri: fullUrl, hasImage: true, gender: u.gender };
      }
    }
    // No image - will use View fallback with gender-based emoji
    return { uri: null, hasImage: false, gender: u.gender };
  };

  const isCurrentUser = (u: LeaderboardUser) =>
    user?.id === u.id || user?.id === u._id;

  // Sort defensively by rank before splitting
  const sortedLeaderboard = [...leaderboard].sort((a, b) => a.rank - b.rank);
  const topThree = sortedLeaderboard.filter((u) => u.rank <= 3);
  const rank1 = topThree.find((u) => u.rank === 1);
  const rank2 = topThree.find((u) => u.rank === 2);
  const rank3 = topThree.find((u) => u.rank === 3);
  const restList = sortedLeaderboard.filter((u) => u.rank > 3);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
        {/* Header */}
        {!hideHeader && (
          <View style={styles.header}>
            <View style={{ width: 40 }} />
            <View style={styles.headerTitleContainer}>
              <HeaderLogo />
            </View>
          </View>
        )}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={styles.loadingText}>{t('leaderboardScreen.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />

      {/* Header */}
      {!hideHeader && (
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <View style={styles.headerTitleContainer}>
            <HeaderLogo />
          </View>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 30) + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Jaap Section */}
        <View style={styles.totalJaapContainer}>
          <Text style={styles.totalJaapTitle}>{t('leaderboardScreen.totalJaap')}</Text>
          <Text style={styles.totalJaapValue}>
            {(myStats?.totalBeads ?? 0).toLocaleString()}
          </Text>
          <Text style={styles.totalJaapSub}>
            {(myStats?.totalJaapSessions ?? 0)} sessions • Lvl {Math.floor((myStats?.totalBeads ?? 0) / 1000) + 1}
          </Text>
        </View>

        {/* Streak Badge */}
        <View style={styles.streakBadgeContainer}>
          <View style={styles.streakBadge}>
            {hasFavoriteDeity && (
              <Image
                source={deitySource}
                style={styles.badgeIcon}
              />
            )}
            <View style={styles.badgeTextContainer}>
              {hasFavoriteDeity ? (
                <>
                  <Text style={styles.badgeTitle}>{deityName}</Text>
                  <Text style={styles.badgeTitle}>Bhagat</Text>
                </>
              ) : (
                <Text style={styles.badgeTitle}>{t('leaderboardScreen.favoriteDeityFallback', 'Favorite Deity')}</Text>
              )}
            </View>
            <Text style={styles.badgeStreak}>
              {t('leaderboardScreen.streak')}: {myStats?.streak ?? 0}
            </Text>
          </View>
        </View>

        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <View style={styles.podiumContainer}>
            {/* Rank 2 (Left) */}
            {rank2 && (
              <View style={[styles.podiumItem, styles.podiumItemLeft]}>
                <View style={styles.avatarContainer}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>2</Text>
                  </View>
                  {(() => {
                    const avatar = getAvatar(rank2);
                    return (
                      <AvatarImage
                        source={avatar.uri ? { uri: avatar.uri } : null}
                        hasImage={avatar.hasImage}
                        gender={avatar.gender}
                        style={StyleSheet.flatten([styles.avatar, styles.avatarSmall])}
                      />
                    );
                  })()}
                </View>
                <Text style={styles.podiumName}>
                  {getName(rank2)}
                  {isCurrentUser(rank2) ? t('leaderboardScreen.youSuffix') : ""}
                </Text>
                <Text style={styles.podiumScore}>
                  📿 {rank2.totalBeads.toLocaleString()}
                </Text>
                <Text style={styles.podiumLevel}>Lvl {getUserLevel(rank2)}</Text>
              </View>
            )}

            {/* Rank 1 (Center) */}
            {rank1 && (
              <View style={[styles.podiumItem, styles.podiumItemCenter]}>
                <View style={styles.avatarContainer}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>1</Text>
                  </View>
                  {(() => {
                    const avatar = getAvatar(rank1);
                    return (
                      <AvatarImage
                        source={avatar.uri ? { uri: avatar.uri } : null}
                        hasImage={avatar.hasImage}
                        gender={avatar.gender}
                        style={StyleSheet.flatten([
                          styles.avatar,
                          styles.avatarLarge,
                          { borderColor: "#4CAF50" },
                        ])}
                      />
                    );
                  })()}
                </View>
                <Text style={styles.podiumName}>
                  {getName(rank1)}
                  {isCurrentUser(rank1) ? t('leaderboardScreen.youSuffix') : ""}
                </Text>
                <Text style={styles.podiumScore}>
                  📿 {rank1.totalBeads.toLocaleString()}
                </Text>
                <Text style={styles.podiumLevel}>Lvl {getUserLevel(rank1)}</Text>
              </View>
            )}

            {/* Rank 3 (Right) */}
            {rank3 && (
              <View style={[styles.podiumItem, styles.podiumItemRight]}>
                <View style={styles.avatarContainer}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>3</Text>
                  </View>
                  {(() => {
                    const avatar = getAvatar(rank3);
                    return (
                      <AvatarImage
                        source={avatar.uri ? { uri: avatar.uri } : null}
                        hasImage={avatar.hasImage}
                        gender={avatar.gender}
                        style={StyleSheet.flatten([styles.avatar, styles.avatarSmall])}
                      />
                    );
                  })()}
                </View>
                <Text style={styles.podiumName}>
                  {getName(rank3)}
                  {isCurrentUser(rank3) ? t('leaderboardScreen.youSuffix') : ""}
                </Text>
                <Text style={styles.podiumScore}>
                  📿 {rank3.totalBeads.toLocaleString()}
                </Text>
                <Text style={styles.podiumLevel}>Lvl {getUserLevel(rank3)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Rest of the List */}
        <View style={styles.listContainer}>
          {restList.map((item) => {
            const isSelf = isCurrentUser(item);
            return (
              <View
                key={item.id || item._id}
                style={[
                  styles.listItemBorder,
                  isSelf ? styles.listItemBorderHighlight : null,
                ]}
              >
                <View
                  style={[
                    styles.listItem,
                    isSelf ? styles.listItemHighlight : null,
                  ]}
                >
                  <Text style={styles.listRank}>{item.rank}</Text>
                  {(() => {
                    const avatar = getAvatar(item);
                    return (
                      <AvatarImage
                        source={avatar.uri ? { uri: avatar.uri } : null}
                        hasImage={avatar.hasImage}
                        gender={avatar.gender}
                        style={StyleSheet.flatten(styles.listAvatar as any)}
                      />
                    );
                  })()}
                  <View style={styles.listNameCol}>
                    <Text style={styles.listName}>
                      {getName(item)}
                      {isSelf ? t('leaderboardScreen.youSuffix') : ""}
                    </Text>
                    <Text style={styles.listLevel}>Lvl {getUserLevel(item)}  •  {item.totalJaapSessions} sessions</Text>
                  </View>
                  <Text style={styles.listScore}>
                    📿 {item.totalBeads.toLocaleString()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Empty state */}
        {leaderboard.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {t('leaderboardScreen.empty')}
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Continue Button */}
      {showContinueButton && (
        <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Button
            title={t('leaderboardScreen.continue')}
            variant="primary"
            fullWidth
            onPress={() => {
              if (onContinue) {
                hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Light);
                onContinue();
              }
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    marginRight: 40,
  },
  headerTitleBlock: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#757575",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  totalJaapContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 15,
  },
  totalJaapTitle: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: "#FF9800",
    marginBottom: -6,
    zIndex: 2,
  },
  totalJaapValue: {
    fontSize: 42,
    fontFamily: "Poppins_700Bold",
    color: "#212121",
    letterSpacing: -0.5,
    includeFontPadding: false,
    lineHeight: 48,
  },
  totalJaapSub: {
    fontSize: 13,
    color: "#757575",
    fontWeight: "500",
    marginTop: 2,
  },
  streakBadgeContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#FFCA28",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 220,
    justifyContent: "space-between",
    shadowColor: "#FFCA28",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  badgeTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#212121",
    lineHeight: 16,
  },
  badgeStreak: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    height: 155,
    marginBottom: 20,
  },
  podiumItem: {
    alignItems: "center",
    width: 95,
  },
  podiumItemLeft: {
    marginBottom: 10,
    marginRight: 2,
    zIndex: 1,
  },
  podiumItemCenter: {
    marginBottom: 35,
    zIndex: 2,
  },
  podiumItemRight: {
    marginBottom: 10,
    marginLeft: 2,
    zIndex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 8,
    alignItems: "center",
  },
  rankBadge: {
    position: "absolute",
    top: -4,
    left: -4,
    backgroundColor: "#FF9800",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  rankText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  avatar: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  avatarSmall: {
    width: 66,
    height: 66,
    borderRadius: 33,
  },
  avatarLarge: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: "#1976D2",
  },
  podiumName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 2,
  },
  podiumScore: {
    fontSize: 10,
    color: "#757575",
    fontWeight: "600",
  },
  podiumLevel: {
    fontSize: 10,
    color: "#F89626",
    fontWeight: "700",
    marginTop: 1,
  },
  listContainer: {
    gap: 10,
  },
  listItemBorder: {
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  listItemBorderHighlight: {
    borderWidth: 1.5,
    borderColor: "#FF9800",
    backgroundColor: "#FF9800",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 10,
  },
  listItemHighlight: {
    backgroundColor: "#FFF3E0",
  },
  listRank: {
    width: 24,
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    textAlign: "center",
  },
  listAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 10,
  },
  listNameCol: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
  listName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
  listLevel: {
    fontSize: 11,
    color: "#F89626",
    fontWeight: "600",
    marginTop: 1,
  },
  listScore: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginRight: 6,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  continueButton: {
    backgroundColor: "#FF9800",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#FF9800",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
