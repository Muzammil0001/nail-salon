import { useSelector } from "../../../../store/Store";
import Link from "next/link";
import { styled } from "@mui/material";
import { AppState } from "../../../../store/Store";
import Image from "next/image";

const Logo = () => {
  const customizer = useSelector((state: AppState) => state.customizer);

  const LinkStyled = styled(Link)(() => ({
    height: customizer.TopbarHeight,
    width: customizer.isCollapse ? "40px" : "180px",
    overflow: "hidden",
    display: "block",
  }));

  if (customizer.activeDir === "ltr") {
    return (
      <LinkStyled href="/dashboard">
        {customizer.activeMode === "dark" ? (
          customizer.isCollapse ? null : (
            <Image
              src="/images/logos/logo.svg"
              alt="logo"
              height={customizer.TopbarHeight}
              width={174}
              style={{ paddingTop: "7px", paddingBottom: "7px" }}
              priority
            />
          )
        ) : (
          <>
            {!customizer.isCollapse && (
              <Image
                src="/images/logos/logo.svg"
                alt="logo"
                height={customizer.TopbarHeight}
                width={200}
                style={{ paddingTop: "7px", paddingBottom: "7px" }}
                priority
              />
            )}
          </>
        )}
      </LinkStyled>
    );
  }

  return (
    <LinkStyled href="/">
      {customizer.activeMode === "dark" ? (
        <Image
          src="/images/logos/logo.svg"
          alt="logo"
          height={customizer.TopbarHeight}
          width={174}
          style={{ paddingTop: "7px", paddingBottom: "7px" }}
          priority
        />
      ) : (
        <Image
          src="/images/logos/logo.svg"
          alt="logo"
          height={customizer.TopbarHeight}
          width={174}
          style={{ paddingTop: "7px", paddingBottom: "7px" }}
          priority
        />
      )}
    </LinkStyled>
  );
};

export default Logo;
