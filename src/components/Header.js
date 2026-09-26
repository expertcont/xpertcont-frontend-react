import { useState } from 'react';
import { Avatar, Box, AppBar, Toolbar, Typography, Button, IconButton, Tooltip, Popover } from '@mui/material';
import { useMediaQuery, useTheme } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PaletteIcon from '@mui/icons-material/Palette';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { useAuth0 } from '@auth0/auth0-react';
import palette, { applyTheme, getStoredThemeId, getThemeValues, themeOptions } from '../theme/palette';

export default function Header({ panoramicMode = false, onExitPanoramic }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0();
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [themeAnchor, setThemeAnchor] = useState(null);
  const [selectedThemeId, setSelectedThemeId] = useState(getStoredThemeId());
  const userName = user?.name || user?.email || 'Usuario';
  const userInitials = userName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  const headerIconSx = {
    width: panoramicMode && !isMobile ? 28 : 34,
    height: panoramicMode && !isMobile ? 28 : 34,
    color: palette.muted,
    border: 'none',
    backgroundColor: palette.overlaySoft,
    '&:hover': {
      color: palette.accent,
      backgroundColor: palette.accentSoft,
    },
  };

  const handleOpenProfile = (event) => {
    setProfileAnchor(event.currentTarget);
  };

  const handleCloseProfile = () => {
    setProfileAnchor(null);
  };

  const handleOpenTheme = (event) => {
    setThemeAnchor(event.currentTarget);
  };

  const handleCloseTheme = () => {
    setThemeAnchor(null);
  };

  const handleSelectTheme = (themeId) => {
    applyTheme(themeId);
    setSelectedThemeId(themeId);
    handleCloseTheme();
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: palette.navBg,
        boxShadow: 'none',
        borderBottom: 'none',
        top: 0,
        width: '100%',
        borderRadius: 0,
        zIndex: 1100,
        ...(panoramicMode && !isMobile
          ? { height: 36, minHeight: 36, maxHeight: 36, overflow: 'hidden' }
          : {}),
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          minHeight: isMobile ? '56px' : panoramicMode ? '36px' : '64px',
          height: isMobile ? '56px' : panoramicMode ? '36px' : '64px',
          maxHeight: isMobile ? '56px' : panoramicMode ? '36px' : '64px',
          px: { xs: 1, sm: 2, md: panoramicMode ? 1 : 3 },
          py: 0,
          mx: 0,
          mt: 0,
          transition: 'min-height 0.2s ease, padding 0.2s ease',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: 0,
          boxShadow: 'none',
        }}
      >
        {panoramicMode && !isMobile && (
          <Button
            size="small"
            startIcon={<FullscreenExitIcon sx={{ fontSize: 16 }} />}
            onClick={onExitPanoramic}
            sx={{
              mr: "auto",
              minHeight: 28,
              height: 28,
              px: 0.85,
              color: palette.accent,
              borderColor: palette.accent,
              backgroundColor: palette.accentSoft,
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "none",
              whiteSpace: "nowrap",
              "&:hover": {
                borderColor: palette.accent,
                backgroundColor: palette.accentSoft,
              },
            }}
          >
            Cerrar vista panorámica
          </Button>
        )}
        {isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: panoramicMode ? 0.5 : 1.25 }}>
            <Tooltip title="Notificaciones">
              <IconButton size="small" sx={headerIconSx}>
                <NotificationsNoneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ayuda">
              <IconButton size="small" sx={headerIconSx}>
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Color de resalte">
              <IconButton
                size="small"
                onClick={handleOpenTheme}
                sx={{
                  ...headerIconSx,
                  color: palette.accent,
                  backgroundColor: palette.accentSoft,
                }}
              >
                <PaletteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Popover
              open={Boolean(themeAnchor)}
              anchorEl={themeAnchor}
              onClose={handleCloseTheme}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  mt: 1.25,
                  p: 1,
                  backgroundColor: palette.surface,
                  color: palette.text,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 2,
                  boxShadow: palette.shadowSoft,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1 }}>
                {(() => {
                  const lightTheme = themeOptions.find((themeOption) => themeOption.id === 'light-smoke');
                  if (!lightTheme) return null;

                  const values = getThemeValues(lightTheme.id);
                  const isSelected = selectedThemeId === lightTheme.id;

                  return (
                    <Box sx={{ display: 'grid', gap: 0.45, justifyItems: 'center' }}>
                      <Typography sx={{ color: palette.muted, fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}>
                        Light
                      </Typography>
                      <Tooltip title={lightTheme.label}>
                        <IconButton
                          size="small"
                          onClick={() => handleSelectTheme(lightTheme.id)}
                          sx={{
                            width: 34,
                            height: 34,
                            p: 0.35,
                            border: `1px solid ${isSelected ? values.accent : palette.borderSoft}`,
                            backgroundColor: '#f5f5f5',
                            boxShadow: isSelected ? `0 0 0 3px ${values.accentSoft}` : 'none',
                            '&:hover': {
                              backgroundColor: '#ffffff',
                              borderColor: values.accent,
                            },
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              backgroundColor: '#ffffff',
                              border: '1px solid #d6d9dd',
                            }}
                          />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  );
                })()}

                <Box sx={{ width: '1px', height: 38, backgroundColor: palette.borderSoft }} />

                <Box sx={{ display: 'grid', gap: 0.45 }}>
                  <Typography sx={{ color: palette.muted, fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}>
                    Dark
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    {themeOptions.filter((themeOption) => themeOption.id !== 'light-smoke').map((themeOption) => {
                      const values = getThemeValues(themeOption.id);
                      const isSelected = selectedThemeId === themeOption.id;

                      return (
                        <Tooltip key={themeOption.id} title={themeOption.label}>
                          <IconButton
                            size="small"
                            onClick={() => handleSelectTheme(themeOption.id)}
                            sx={{
                              width: 30,
                              height: 30,
                              p: 0.35,
                              border: `1px solid ${isSelected ? values.accent : palette.borderSoft}`,
                              backgroundColor: isSelected ? values.accentSoft : palette.overlaySoft,
                              '&:hover': {
                                backgroundColor: values.accentSoft,
                                borderColor: values.accent,
                              },
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                backgroundColor: values.accent,
                                boxShadow: isSelected ? `0 0 0 3px ${values.accentSoft}` : 'none',
                              }}
                            />
                          </IconButton>
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            </Popover>
            {!isMobile && !panoramicMode && (
              <Typography
                sx={{
                  color: palette.text,
                  fontSize: '0.84rem',
                  fontWeight: 500,
                  maxWidth: 220,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {userName}
              </Typography>
            )}
            <Tooltip title="Ver perfil">
              <Avatar
                alt={userName}
                onClick={handleOpenProfile}
                sx={{
                  width: panoramicMode && !isMobile ? 28 : 34,
                  height: panoramicMode && !isMobile ? 28 : 34,
                  bgcolor: palette.accent,
                  color: palette.onAccent,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: `1px solid ${palette.accent}`,
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: palette.shadowSoft,
                  },
                }}
              >
                {userInitials || 'U'}
              </Avatar>
            </Tooltip>
            <Popover
              open={Boolean(profileAnchor)}
              anchorEl={profileAnchor}
              onClose={handleCloseProfile}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  mt: 1.25,
                  width: 240,
                  p: 2,
                  backgroundColor: palette.surface,
                  color: palette.text,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 2,
                  boxShadow: palette.shadowSoft,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  src={user?.picture}
                  alt={userName}
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: palette.accent,
                    color: palette.onAccent,
                    fontSize: '1rem',
                    fontWeight: 700,
                    border: `1px solid ${palette.accent}`,
                  }}
                >
                  {userInitials || 'U'}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      color: palette.text,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {userName}
                  </Typography>
                  <Typography
                    sx={{
                      color: palette.muted,
                      fontSize: '0.74rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user?.email || ''}
                  </Typography>
                </Box>
              </Box>
            </Popover>
            <IconButton
              size="small"
              onClick={() => logout()}
              sx={{
                width: panoramicMode && !isMobile ? 28 : undefined,
                height: panoramicMode && !isMobile ? 28 : undefined,
                color: palette.muted,
                border: `1px solid ${palette.borderSoft}`,
                backgroundColor: palette.overlaySoft,
                '&:hover': {
                  color: palette.accent,
                  backgroundColor: palette.accentSoft,
                  borderColor: palette.accent,
                },
              }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Button
            variant="outlined"
            onClick={() => loginWithRedirect()}
            sx={{
              color: palette.accent,
              borderColor: palette.accent,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: palette.accent,
                backgroundColor: palette.accentSoft,
              },
            }}
          >
            Ingresar
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
